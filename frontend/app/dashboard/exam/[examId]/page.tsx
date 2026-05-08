"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/app/api/axios";

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
}

interface QuestionDto {
    questionId: number;
    text: string;
    type: string;
    points: number;
    negativePoints: number;
}

interface ExamDetails {
    examId: number;
    title: string;
    testLink: string | null;
    settings: SettingDto | null;
    questions: QuestionDto[];
}

export default function ExamDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId;
    
    const [exam, setExam] = useState<ExamDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const fetchExamDetails = async () => {
            try {
                const res = await api.get(`/exam/${examId}`);
                if (res.data) {
                    setExam(res.data);
                }
            } catch (err: any) {
                console.error("Failed to fetch exam details", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (examId) {
            fetchExamDetails();
        }
    }, [examId, router]);

    const handleCopy = () => {
        if (!exam?.testLink) return;
        const fullLink = `${window.location.origin}/attempt/${exam.testLink}`;
        navigator.clipboard.writeText(fullLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isLoading) {
        return <div className="min-h-screen bg-[#fdf8f3] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#59524d]"></div>
        </div>;
    }

    if (!exam) {
        return <div className="min-h-screen bg-[#fdf8f3] flex items-center justify-center text-[#b3a89c] font-sans">Exam not found.</div>;
    }

    return (
        <div className="min-h-screen bg-[#fdf8f3] font-sans text-[#23201a]">
            {/* Header */}
            <nav className="flex items-center justify-between px-8 py-4 border-b border-[#ece7df] bg-white">
                <h1 className="text-xl font-bold font-serif">Exam Details</h1>
                <Link href="/dashboard">
                    <button className="px-4 py-2 border border-[#ece7df] rounded-lg text-sm font-medium text-[#7c766a] hover:bg-[#f3f0e7] transition-colors font-sans">&larr; Back to Dashboard</button>
                </Link>
            </nav>

            <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
                {/* Hero Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#ece7df]">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight font-serif text-[#23201a]">{exam.title}</h2>
                            <p className="text-[#7c766a] mt-1">ID: {exam.examId} • {exam.questions.length} Questions</p>
                        </div>
                        <Link href={`/dashboard/results/${exam.examId}`}>
                            <button className="px-6 py-3 bg-[#0e9e82] text-white rounded-xl shadow hover:bg-[#0b7e68] font-semibold hover:-translate-y-0.5 transition-all">
                                View Results Leaderboard
                            </button>
                        </Link>
                    </div>
                    <div className="mt-8 bg-[#f8f5f0] p-6 rounded-xl border border-[#ece7df]">
                        <h3 className="text-xs font-bold text-[#7c766a] uppercase tracking-wider mb-3 font-sans">Student Test Link</h3>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                readOnly
                                value={exam.testLink ? `${window.location.origin}/attempt/${exam.testLink}` : 'Not Generated'}
                                className="flex-1 px-4 py-3 bg-white border border-[#ece7df] rounded-lg text-[#59524d] font-mono text-sm outline-none"
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-6 py-3 rounded-lg font-semibold text-sm border transition-colors font-sans ${copied ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white border-[#ece7df] text-[#59524d] hover:bg-[#f3f0e7]'}`}
                            >
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-[#b3a89c] font-sans">Share this link directly with students to start their exam.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Settings Sidebar */}
                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#ece7df] sticky top-24">
                            <h3 className="text-lg font-bold text-[#23201a] mb-6 font-serif">Test Settings</h3>
                            {exam.settings ? (
                                <ul className="space-y-4">
                                    <li className="flex justify-between items-center text-sm font-sans">
                                        <span className="text-[#7c766a]">Duration</span>
                                        <span className="font-semibold text-[#23201a]">{exam.settings.duration} min</span>
                                    </li>
                                    <li className="flex justify-between items-center text-sm font-sans">
                                        <span className="text-[#7c766a]">Max Attempts</span>
                                        <span className="font-semibold text-[#23201a]">{exam.settings.maxAttempts}</span>
                                    </li>
                                    <li className="flex justify-between items-center text-sm pt-3 border-t border-[#ece7df] font-sans">
                                        <span className="text-[#7c766a]">Proctoring</span>
                                        {exam.settings.enableProctor
                                            ? <span className="px-2 py-1 bg-green-100 text-green-900 rounded text-xs font-bold font-sans">Enabled</span>
                                            : <span className="px-2 py-1 bg-[#ece7df] text-[#7c766a] rounded text-xs font-bold font-sans">Disabled</span>
                                        }
                                    </li>
                                    {exam.settings.enableProctor && (
                                        <>
                                            <li className="flex justify-between items-center text-sm font-sans">
                                                <span className="text-[#7c766a]">Camera</span>
                                                <input type="checkbox" checked={exam.settings.camera} readOnly className="accent-[#0e9e82] w-4 h-4" />
                                            </li>
                                            <li className="flex justify-between items-center text-sm font-sans">
                                                <span className="text-[#7c766a]">Microphone</span>
                                                <input type="checkbox" checked={exam.settings.microphone} readOnly className="accent-[#0e9e82] w-4 h-4" />
                                            </li>
                                            <li className="flex justify-between items-center text-sm font-sans">
                                                <span className="text-[#7c766a]">Tab Switch</span>
                                                <input type="checkbox" checked={exam.settings.tabSwitch} readOnly className="accent-[#0e9e82] w-4 h-4" />
                                            </li>
                                            <li className="flex justify-between items-center text-sm font-sans">
                                                <span className="text-[#7c766a]">Full Screen</span>
                                                <input type="checkbox" checked={exam.settings.fullScreen} readOnly className="accent-[#0e9e82] w-4 h-4" />
                                            </li>
                                        </>
                                    )}
                                </ul>
                            ) : (
                                <p className="text-[#7c766a] text-sm font-sans">No specific settings configured.</p>
                            )}
                        </div>
                    </div>

                    {/* Questions List */}
                    <div className="md:col-span-2">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#ece7df]">
                            <h3 className="text-lg font-bold text-[#23201a] mb-6 flex items-center justify-between font-serif">
                                Questions
                                <span className="text-sm font-normal text-[#7c766a] font-sans">{exam.questions.length} total</span>
                            </h3>

                            <div className="space-y-4">
                                {exam.questions.map((q, idx) => (
                                    <div key={q.questionId} className="p-5 border border-[#ece7df] rounded-xl hover:border-[#0e9e82] transition-colors bg-[#f8f5f0]">
                                        <div className="flex justify-between py-1 mb-2 border-b border-[#ece7df]">
                                            <span className="text-xs font-bold text-[#0e9e82] uppercase tracking-wider font-sans">{q.type.replace('_', ' ')}</span>
                                            <div className="space-x-2 text-xs font-semibold font-sans">
                                                <span className="text-green-700">+{q.points} Points</span>
                                                <span className="text-red-500">-{q.negativePoints} Points</span>
                                            </div>
                                        </div>
                                        <p className="text-[#23201a] font-medium whitespace-pre-wrap">{idx + 1}. {q.text}</p>
                                    </div>
                                ))}
                                {exam.questions.length === 0 && (
                                    <div className="p-8 text-center text-[#b3a89c]">No questions found in this exam.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
