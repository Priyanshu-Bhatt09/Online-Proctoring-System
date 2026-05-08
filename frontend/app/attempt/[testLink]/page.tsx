"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/api/axios";
import Editor from "@monaco-editor/react";

interface OptionDto {
    optionId: number;
    text: string;
}

interface QuestionDto {
    questionId: number;
    text: string;
    type: string;
    points: number;
    negativePoints: number;
    options: OptionDto[];
}

interface SettingDto {
    duration: number;
    maxAttempts: number;
    enableTimer: boolean;
    enableProctor: boolean;
    tabSwitch: boolean;
    camera: boolean;
    microphone: boolean;
    fullScreen: boolean;
    multiMonitor: boolean;
    photosRandom: boolean;
}

interface ExamInfo {
    examId: number;
    title: string;
    testLink: string;
    duration: number;
    settings: SettingDto;
    questions: QuestionDto[];
}

export default function AttemptPage() {
    const params = useParams();
    const router = useRouter();
    const testLink = params.testLink as string;

    const [exam, setExam] = useState<ExamInfo | null>(null);
    const [loadingExam, setLoadingExam] = useState(true);
    const [error, setError] = useState<string>("");

    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [attemptStarted, setAttemptStarted] = useState(false);
    
    // Answers state [questionId -> answer content]
    const [answers, setAnswers] = useState<{ [key: number]: any }>({});
    const [savingOption, setSavingOption] = useState<number | null>(null);

    const [timeLeft, setTimeLeft] = useState<number>(0);
    const initialTimeRef = useRef<number>(0);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState<number | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mediaGranted, setMediaGranted] = useState(false);

    // 1. Fetch Exam Details
    useEffect(() => {
        if (!testLink) return;
        const fetchExam = async () => {
            try {
                // No token required for just viewing exam details
                const res = await api.get(`/exam/link/${testLink}`);
                setExam(res.data);
                if (res.data.settings?.duration) {
                    const totalSec = res.data.settings.duration * 60;
                    setTimeLeft(totalSec);
                    initialTimeRef.current = totalSec;
                } else if (res.data.duration) {
                    const totalSec = res.data.duration * 60;
                    setTimeLeft(totalSec);
                    initialTimeRef.current = totalSec;
                }
            } catch (err: any) {
                console.error(err);
                setError("Exam not found or invalid link.");
            } finally {
                setLoadingExam(false);
            }
        };
        fetchExam();
    }, [testLink]);

    // 2. Timer Countdown effect
    useEffect(() => {
        if (!attemptStarted || submitted || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [attemptStarted, submitted, timeLeft]);

    // Refs for proctoring cleanup
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const faceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const randomPhotoIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const noiseDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const logViolation = async (type: string, message: string, imageUrl: string = "") => {
        if (!attemptId) {
            console.warn("logViolation called but attemptId is null, type:", type, "msg:", message);
            return;
        }
        try {
            console.log(`[PROCTOR] Logging violation: ${type} — ${message}`);
            await api.post(`/attempt/${attemptId}/violation`, {
                type,
                message,
                imageUrl: imageUrl || ""
            });
        } catch (e) {
            console.error("Failed to log violation", e);
        }
    };

    const handleTakeRandomPhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video.videoWidth > 0) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const base64 = canvas.toDataURL("image/jpeg", 0.5);
                    logViolation("RANDOM_PHOTO", "Periodic random photo captured.", base64);
                }
            }
        }
    };

    // Proctoring setup effect — requests permissions first, then enters fullscreen
    useEffect(() => {
        if (!attemptStarted || submitted || !exam?.settings?.enableProctor) return;

        let cancelled = false;

        const loadFaceApi = async () => {
            try {
                if (!(window as any).faceapi) {
                    console.log("[PROCTOR] Loading face-api.js from CDN...");
                    await new Promise((resolve, reject) => {
                        const script = document.createElement("script");
                        script.src = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js";
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                    console.log("[PROCTOR] face-api.js script loaded.");
                }
                console.log("[PROCTOR] Loading face detection model...");
                await (window as any).faceapi.nets.tinyFaceDetector.loadFromUri("https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/");
                console.log("[PROCTOR] Face detection model loaded successfully.");
                return true;
            } catch (err) {
                console.error("[PROCTOR] Face API failed to init", err);
                return false;
            }
        };

        const setupAudioNoiseDetection = (stream: MediaStream) => {
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContextRef.current = audioContext;
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 512;
                analyser.smoothingTimeConstant = 0.1;
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const NOISE_THRESHOLD = 15; // RMS volume threshold (scale 0-255, speech is ~10-50)
                let consecutiveNoiseCount = 0;
                const CONSECUTIVE_REQUIRED = 1; // Trigger on FIRST detected noise above threshold

                noiseDetectionIntervalRef.current = setInterval(() => {
                    if (cancelled) return;
                    analyser.getByteTimeDomainData(dataArray);

                    // Calculate RMS (root-mean-square) volume level
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        const val = (dataArray[i] - 128) / 128; // normalize to -1..1
                        sum += val * val;
                    }
                    const rms = Math.sqrt(sum / dataArray.length);
                    const volume = Math.round(rms * 255);

                    // Always log volume so we can verify mic is working
                    console.log(`[PROCTOR] Audio level: ${volume} (threshold: ${NOISE_THRESHOLD})`);

                    if (volume > NOISE_THRESHOLD) {
                        consecutiveNoiseCount++;
                        console.warn(`[PROCTOR] 🔊 NOISE ABOVE THRESHOLD: level=${volume}, consecutive=${consecutiveNoiseCount}/${CONSECUTIVE_REQUIRED}`);
                        if (consecutiveNoiseCount >= CONSECUTIVE_REQUIRED) {
                            logViolation("EXCESSIVE_NOISE", `Excessive background noise detected (level: ${volume}).`);
                            // Wait a short bit before triggering another noise alert immediately
                            consecutiveNoiseCount = -2; // introduces a small cooldown
                        }
                    } else {
                        if (consecutiveNoiseCount > 0) {
                            console.log(`[PROCTOR] Noise dropped below threshold, resetting consecutive count from ${consecutiveNoiseCount}`);
                        }
                        consecutiveNoiseCount = 0;
                    }
                }, 2000); // Check every 2 seconds

                console.log("[PROCTOR] Audio noise detection started.");
            } catch (err) {
                console.error("[PROCTOR] Failed to set up audio noise detection", err);
            }
        };

        // Use the stream that was already obtained in handleStartTest
        const setupMonitoring = async () => {
            const stream = streamRef.current;
            const hasCamera = exam.settings.camera || exam.settings.photosRandom;
            const hasMic = exam.settings.microphone;

            if (stream) {
                // Attach video to element
                if (videoRef.current && hasCamera) {
                    videoRef.current.srcObject = stream;
                }

                // Start audio noise monitoring if microphone is enabled
                if (hasMic) {
                    setupAudioNoiseDetection(stream);
                }

                // Start face detection if camera is enabled
                if (exam.settings.camera) {
                    const isLoaded = await loadFaceApi();
                    if (isLoaded && !cancelled) {
                        // Wait for video to be ready
                        const waitForVideo = () => new Promise<void>((resolve) => {
                            if (videoRef.current && videoRef.current.readyState >= 2) {
                                resolve();
                                return;
                            }
                            const checkInterval = setInterval(() => {
                                if (videoRef.current && videoRef.current.readyState >= 2) {
                                    clearInterval(checkInterval);
                                    resolve();
                                }
                            }, 500);
                            setTimeout(() => { clearInterval(checkInterval); resolve(); }, 10000);
                        });
                        await waitForVideo();

                        console.log("[PROCTOR] Starting face detection loop...");
                        faceDetectionIntervalRef.current = setInterval(async () => {
                            if (cancelled) return;
                            try {
                                if (videoRef.current && videoRef.current.readyState >= 2) {
                                    const detections = await (window as any).faceapi.detectAllFaces(
                                        videoRef.current,
                                        new (window as any).faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.2 })
                                    );
                                    console.log(`[PROCTOR] Face detection: ${detections.length} face(s) found`);

                                    if (detections.length !== 1) {
                                        let base64 = "";
                                        try {
                                            const canvas = document.createElement("canvas");
                                            canvas.width = videoRef.current.videoWidth;
                                            canvas.height = videoRef.current.videoHeight;
                                            canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
                                            base64 = canvas.toDataURL("image/jpeg", 0.5);
                                        } catch (snapErr) {
                                            console.error("[PROCTOR] Snapshot capture failed", snapErr);
                                        }

                                        if (detections.length === 0) {
                                            logViolation("NO_FACE", "No face detected in webcam feed.", base64);
                                        } else {
                                            logViolation("MULTIPLE_FACES", `${detections.length} faces detected in webcam feed.`, base64);
                                        }
                                    }
                                }
                            } catch (faceErr) {
                                console.error("[PROCTOR] Face detection error in interval:", faceErr);
                            }
                        }, 5000);
                    } else if (!isLoaded) {
                        console.warn("[PROCTOR] Face API could not be loaded. Face detection disabled.");
                    }
                }
            } else {
                console.warn("[PROCTOR] No media stream available. Camera/mic may not have been requested.");
            }

            // Random photo snapshots
            if (exam.settings.photosRandom && !cancelled) {
                randomPhotoIntervalRef.current = setInterval(() => {
                    if (!cancelled) handleTakeRandomPhoto();
                }, 60000);
            }
        };

        setupMonitoring();

        // Event listeners for tab switch and fullscreen exit
        const handleVisibilityChange = () => {
            if (document.hidden && exam.settings.tabSwitch && !submitted) {
                logViolation("TAB_SWITCH", "User switched tabs or minimized window.");
                alert("WARNING: You have switched tabs! This violation has been recorded.");
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && exam.settings.fullScreen && !submitted) {
                logViolation("FULLSCREEN_EXIT", "User exited fullscreen mode.");
                alert("WARNING: You exited fullscreen! This violation has been recorded. Re-entering fullscreen...");
                // Auto re-enter fullscreen
                setTimeout(() => {
                    if (!document.fullscreenElement && !submitted) {
                        document.documentElement.requestFullscreen().catch(err => {
                            console.error("[PROCTOR] Failed to re-enter fullscreen", err);
                        });
                    }
                }, 1000);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            cancelled = true;
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => {});
                audioContextRef.current = null;
            }
            if (faceDetectionIntervalRef.current) clearInterval(faceDetectionIntervalRef.current);
            if (randomPhotoIntervalRef.current) clearInterval(randomPhotoIntervalRef.current);
            if (noiseDetectionIntervalRef.current) clearInterval(noiseDetectionIntervalRef.current);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, [attemptStarted, submitted, exam, attemptId]);

    const handleButtonClick = async () => {
        const hasCamera = exam?.settings?.camera || exam?.settings?.photosRandom;
        const hasMic = exam?.settings?.microphone;
        const needsMedia = exam?.settings?.enableProctor && (hasCamera || hasMic);

        if (needsMedia && !mediaGranted) {
            try {
                console.log("[PROCTOR] Requesting media permissions (in click handler)...");
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: hasCamera,
                    audio: hasMic
                });
                streamRef.current = stream;
                setMediaGranted(true);
                console.log("[PROCTOR] Media permissions granted.");
            } catch (permErr) {
                console.error("[PROCTOR] Media permission denied", permErr);
                alert("Camera/Microphone permission denied! You must grant permissions to start the exam.");
            }
            return;
        }

        handleStartTest();
    };

    const handleStartTest = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push(`/login?redirect=/attempt/${testLink}`);
            return;
        }
        if (!exam) return;

        // Step 1: Immediately request fullscreen because it's a synchronous user action!
        if (exam.settings?.fullScreen) {
            try {
                console.log("[PROCTOR] Entering fullscreen mode...");
                await document.documentElement.requestFullscreen();
                console.log("[PROCTOR] Fullscreen entered successfully.");
            } catch (e) {
                console.error("[PROCTOR] Fullscreen request failed", e);
            }
        }

        try {
            // Step 2: Start the attempt on the backend
            const res = await api.post("/attempt/start", { examId: exam.examId });

            // Step 3: Set state to trigger the monitoring useEffect
            setAttemptId(res.data.id);
            setAttemptStarted(true);
        } catch (err: any) {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(e => console.log(e));
            }
            const backendMsg = err.response?.data?.message || err.response?.data || "";
            if (typeof backendMsg === 'string' && backendMsg.trim() !== '') {
                setError(backendMsg);
            } else {
                setError("Failed to start the test. You may have reached the maximum allowed attempts.");
            }
        }
    };

    const saveTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

    const handleSaveAnswerToBackend = (questionId: number, selectedOptionId?: number | null, textAnswer?: string | null) => {
        if (submitted || !attemptId) return;

        if (saveTimeouts.current[questionId]) {
            clearTimeout(saveTimeouts.current[questionId]);
        }

        setSavingOption(questionId);

        saveTimeouts.current[questionId] = setTimeout(async () => {
            try {
                await api.post("/attempt/answer", {
                    attemptId: attemptId,
                    questionId: questionId,
                    selectedOptionId: selectedOptionId || null,
                    textAnswer: textAnswer || ""
                });
            } catch (err: any) {
                console.error("Failed to save answer", err.response?.data || err);
            } finally {
                setSavingOption(null);
            }
        }, 600); // Debounce to allow rapid clicking without overloading backend
    };

    const handleSelectRadio = (questionId: number, optionId: number) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
        handleSaveAnswerToBackend(questionId, optionId, null);
    };

    const handleToggleCheckbox = (questionId: number, optionId: number) => {
        if (submitted) return;
        setAnswers(prev => {
            const current = (prev[questionId] as number[]) || [];
            const updated = current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId];
            
            // Backend accepts 1 optionId normally, we pass it there, or just pass as text
            handleSaveAnswerToBackend(questionId, updated[0] || null, JSON.stringify(updated));
            return { ...prev, [questionId]: updated };
        });
    };

    const handleTextChange = (questionId: number, text: string) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [questionId]: text }));
    };

    const handleTextBlur = (questionId: number) => {
        if (submitted) return;
        const text = (answers[questionId] as string) || "";
        handleSaveAnswerToBackend(questionId, null, text);
    };

    const submitExamAPI = async () => {
        if (!attemptId) return;
        try {
            setSubmitted(true);
            const res = await api.post(`/attempt/submit/${attemptId}`);
            setScore(res.data.score);
        } catch (err) {
            console.error("Submit error", err);
            setError("Failed to submit exam. Please try again.");
            setSubmitted(false); // allow retry
        }
    };

    const handleAutoSubmit = () => {
        if (!submitted) {
            submitExamAPI();
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loadingExam) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>;
    }

    if (error && !attemptStarted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-slate-100">
                    <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2 font-serif">{error}</h2>
                    <p className="text-slate-500 mb-6">Please verify the link you were given and try again.</p>
                </div>
            </div>
        );
    }

    if (!exam) return null;

    // View: Pre-Test Landing
    if (!attemptStarted && !submitted) {
        return (
            <div className="min-h-screen bg-[#f8f8f5] flex items-center justify-center p-4 font-sans">
                <div className="bg-white p-10 rounded-3xl shadow-xl max-w-2xl w-full border border-[#ece7df]">
                    <div className="text-center mb-10">
                        <span className="px-3 py-1 bg-[#eaf0ff] text-[#3b5fc7] font-bold text-xs uppercase tracking-widest rounded-full font-sans">Exam Invitation</span>
                        <h1 className="text-4xl font-extrabold text-[#23201a] mt-4 font-serif">{exam.title}</h1>
                        <p className="text-[#7c766a] mt-3 text-lg">You are about to start a new exam attempt.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="bg-[#f5f5f2] p-5 rounded-2xl border border-[#ece7df] text-center">
                            <span className="block text-[#7c766a] text-sm font-medium mb-1 font-sans">Total Questions</span>
                            <span className="text-2xl font-bold text-[#23201a]">{exam.questions.length}</span>
                        </div>
                        <div className="bg-[#f5f5f2] p-5 rounded-2xl border border-[#ece7df] text-center">
                            <span className="block text-[#7c766a] text-sm font-medium mb-1 font-sans">Time Limit</span>
                            <span className="text-2xl font-bold text-[#23201a]">{timeLeft > 0 ? (timeLeft / 60) + " mins" : "Unlimited"}</span>
                        </div>
                    </div>

                    <div className="bg-[#eaf0ff] border border-[#c7d7f7] rounded-xl p-5 mb-10 text-sm text-[#3b5fc7] flex items-start gap-4 font-sans">
                        <svg className="w-6 h-6 flex-shrink-0 mt-0.5 text-[#3b5fc7]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p>Once you click start, the timer will begin immediately. Depending on the test settings, leaving the tab or minimizing the browser may automatically terminate your attempt. Ensure you have a stable internet connection.</p>
                    </div>

                    <button 
                        onClick={handleButtonClick}
                        className="w-full py-4 bg-gradient-to-r from-[#3b7c5c] to-[#217a4a] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                    >
                        {exam.settings?.enableProctor && (exam.settings.camera || exam.settings.photosRandom || exam.settings.microphone) && !mediaGranted 
                            ? "Grant Camera & Mic Permissions" 
                            : "Start Test Now"}
                    </button>
                </div>
            </div>
        );
    }

    // View: Submitted Post-Test
    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-10 rounded-3xl shadow-xl max-w-xl w-full text-center border border-slate-100">
                    <div className="mx-auto w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-lg">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 mb-2 font-serif">Test Submitted!</h1>
                    <p className="text-slate-500 mb-8">Your response has been successfully recorded.</p>
                    
                    {score !== null && score >= 0 && (
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 mb-8 inline-block shadow-inner w-full">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2 font-sans">Final Score</p>
                            <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600">
                                {score}
                            </span>
                            <p className="text-slate-400 font-medium text-sm mt-3 font-sans">Points Earned</p>
                        </div>
                    )}
                    {score !== null && score < 0 && (
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 mb-8 w-full">
                            <p className="text-amber-700 font-semibold">📋 Your results will be published by your instructor.</p>
                            <p className="text-amber-600 text-sm mt-1 font-sans">Check your dashboard later for your score.</p>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-4 bg-slate-100 text-slate-700 font-bold text-lg rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // View: Taking the Test
    return (
        <div className="min-h-screen bg-[#f8f8f5] flex flex-col font-sans">
            {/* Sticky Exam Header */}
            <header className="bg-white border-b border-[#ece7df] sticky top-0 z-50 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <h1 className="font-bold text-[#23201a] text-2xl sm:text-3xl truncate mr-4 font-serif">
                        {exam.title}
                    </h1>
                    <div className="flex items-center gap-6">
                        {exam.settings?.enableProctor && exam.settings?.camera && (
                            <div className="hidden sm:block">
                                <video ref={videoRef} autoPlay muted playsInline className="w-16 h-12 object-cover bg-black rounded border border-[#ece7df]" />
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        )}
                        {exam.settings?.enableTimer && (() => {
                            const totalTime = initialTimeRef.current || 1;
                            const fraction = timeLeft / totalTime;
                            const radius = 20;
                            const circumference = 2 * Math.PI * radius;
                            const dashOffset = circumference * (1 - fraction);
                            const timerColor = timeLeft < 60 ? '#ef4444' : timeLeft < 300 ? '#f59e0b' : '#3b7c5c';
                            const bgTimerColor = timeLeft < 60 ? 'rgba(239,68,68,0.1)' : timeLeft < 300 ? 'rgba(245,158,11,0.1)' : 'rgba(59,124,92,0.1)';
                            return (
                                <div className="flex items-center gap-3" style={{ background: bgTimerColor, padding: '6px 16px 6px 8px', borderRadius: '12px' }}>
                                    {/* Circular Progress Ring */}
                                    <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
                                        <circle cx="24" cy="24" r={radius} fill="none" stroke="#ece7df" strokeWidth="4" />
                                        <circle
                                            cx="24" cy="24" r={radius}
                                            fill="none"
                                            stroke={timerColor}
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={dashOffset}
                                            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                                        />
                                    </svg>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{
                                            fontFamily: 'monospace',
                                            fontWeight: 800,
                                            fontSize: '1.1rem',
                                            color: timerColor,
                                            letterSpacing: '0.05em',
                                            animation: timeLeft < 60 ? 'pulse 1s ease-in-out infinite' : 'none'
                                        }}>
                                            {formatTime(timeLeft)}
                                        </span>
                                        <span style={{ display: 'block', fontSize: '0.6rem', color: '#b3a89c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            remaining
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}
                        <button 
                            onClick={submitExamAPI}
                            className="px-6 py-2 bg-[#3b7c5c] text-white text-sm font-bold rounded-lg shadow-md hover:bg-[#217a4a] transition font-sans"
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </header>
            {/* Timer progress bar at top */}
            {exam.settings?.enableTimer && (
                <div style={{ width: '100%', height: '4px', background: '#ece7df' }}>
                    <div style={{
                        height: '100%',
                        width: `${(timeLeft / (initialTimeRef.current || 1)) * 100}%`,
                        background: timeLeft < 60 ? '#ef4444' : timeLeft < 300 ? '#f59e0b' : 'linear-gradient(90deg, #3b7c5c, #217a4a)',
                        transition: 'width 1s linear, background 0.5s ease',
                        borderRadius: '0 2px 2px 0'
                    }} />
                </div>
            )}

            {/* Questions Container */}
            <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 pb-32 font-sans">
                {exam.questions.map((q, idx) => {
                    const isCheckbox = q.type === 'MULTIPLE_CHOICE_A' || q.type === 'MCA';
                    const isMCQ = q.type === 'MULTIPLE_CHOICE_Q' || q.type === 'MCQ';
                    const isText = q.type === 'SINGLE_LINE_TEXT' || q.type === 'SHORT_TEXT';
                    const isCoding = q.type === 'CODING';

                    return (
                        <div key={q.questionId} className="bg-white rounded-2xl shadow border border-[#ece7df] p-6 sm:p-8 mb-6">
                            <div className="flex justify-between items-start mb-4">
                                <span className="inline-block px-3 py-1 bg-[#f3f0e7] text-[#7c5fd7] text-xs font-black uppercase tracking-wider rounded-md border border-[#ece7df] font-sans">
                                    Question {idx + 1}
                                </span>
                                <div className="text-right text-xs font-bold text-[#b3a89c] font-sans">
                                    <span className="text-[#217a4a] bg-[#eafaf1] px-2 py-0.5 rounded mr-2">+{q.points} pt</span>
                                    {q.negativePoints > 0 && <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded">-{q.negativePoints} pt</span>}
                                </div>
                            </div>

                            <h3 className="text-lg text-[#23201a] font-semibold mb-6 leading-relaxed whitespace-pre-wrap font-serif">
                                {q.text}
                            </h3>

                            <div className="space-y-3 relative">
                                {savingOption === q.questionId && (
                                    <div className="absolute -top-6 right-0 text-xs text-blue-500 font-bold flex items-center gap-1 animate-pulse font-sans">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        Saving...
                                    </div>
                                )}

                                {(isMCQ || isCheckbox) && q.options && q.options.length > 0 && q.options.map(opt => {
                                    const selectedArr = (answers[q.questionId] as number[]) || [];
                                    const isSelectedCheckbox = selectedArr.includes?.(opt.optionId);
                                    const isSelectedRadio = answers[q.questionId] === opt.optionId;
                                    const isSelected = isCheckbox ? isSelectedCheckbox : isSelectedRadio;

                                    return (
                                        <label 
                                            key={opt.optionId}
                                            className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-[#3b7c5c] bg-[#eafaf1]' : 'border-[#ece7df] bg-white hover:border-[#b3b3a8]'}`}
                                        >
                                            <div className="flex items-center h-5 mt-0.5">
                                                <input 
                                                    type={isCheckbox ? "checkbox" : "radio"}
                                                    name={`question-${q.questionId}`}
                                                    className={`w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 cursor-pointer ${isCheckbox ? 'rounded focus:ring-blue-500' : 'focus:ring-blue-500'}`}
                                                    checked={isSelected}
                                                    onChange={() => {
                                                        if (isCheckbox) handleToggleCheckbox(q.questionId, opt.optionId);
                                                        else handleSelectRadio(q.questionId, opt.optionId);
                                                    }}
                                                />
                                            </div>
                                            <div className="ml-3 text-sm text-[#23201a] font-medium whitespace-pre-wrap font-sans">
                                                {opt.text}
                                            </div>
                                        </label>
                                    );
                                })}

                                {isText && (
                                    <input 
                                        type="text"
                                        placeholder="Type your answer here..."
                                        className="w-full p-4 border border-[#b3b3a8] rounded-xl focus:ring-2 focus:ring-[#3b7c5c] focus:border-[#3b7c5c] transition-all outline-none font-sans"
                                        value={(answers[q.questionId] as string) || ''}
                                        onChange={(e) => handleTextChange(q.questionId, e.target.value)}
                                        onBlur={() => handleTextBlur(q.questionId)}
                                    />
                                )}

                                {isCoding && (
                                    <div className="border border-[#b3b3a8] rounded-xl overflow-hidden shadow-sm mt-4">
                                        <div className="bg-[#23201a] text-[#eafaf1] px-4 py-2 text-xs font-mono flex justify-between items-center">
                                            <span>CODE EDITOR (Java / Scripts)</span>
                                            <span className="text-[#b3a89c]">Auto-saves on unfocus</span>
                                        </div>
                                        <Editor
                                            height="350px"
                                            defaultLanguage="java"
                                            value={(answers[q.questionId] as string) || ''}
                                            onChange={(value) => handleTextChange(q.questionId, value || '')}
                                            theme="vs-dark"
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 14,
                                                scrollBeyondLastLine: false,
                                                padding: { top: 16 }
                                            }}
                                            onMount={(editor) => {
                                                editor.onDidBlurEditorWidget(() => {
                                                    // Pull directly from the editor instance to avoid stale closure state
                                                    handleSaveAnswerToBackend(q.questionId, null, editor.getValue());
                                                });
                                            }}
                                        />
                                    </div>
                                )}

                                {(!isMCQ && !isCheckbox && !isText && !isCoding) && (
                                    <textarea 
                                        rows={8}
                                        placeholder="Type your long answer here..."
                                        className="w-full p-4 border border-[#b3b3a8] rounded-xl text-sm focus:ring-2 focus:ring-[#3b7c5c] focus:border-[#3b7c5c] transition-all outline-none mt-2 font-sans"
                                        value={(answers[q.questionId] as string) || ''}
                                        onChange={(e) => handleTextChange(q.questionId, e.target.value)}
                                        onBlur={() => handleTextBlur(q.questionId)}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}

                <div className="flex justify-center mt-12">
                    <button 
                        onClick={submitExamAPI}
                        className="px-10 py-4 bg-gradient-to-r from-[#3b7c5c] to-[#217a4a] text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
                    >
                        Finish & Submit Exam
                    </button>
                </div>
            </main>
        </div>
    );
}
