"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/app/api/axios";

interface ResultDto {
    attemptId: number;
    studentName: string | null;
    studentEmail: string | null;
    score: number;
    startTime: string;
    endTime: string;
}

export default function ExamResultsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId;
    
    const [results, setResults] = useState<ResultDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
    const [violations, setViolations] = useState<any[]>([]);
    const [loadingViolations, setLoadingViolations] = useState(false);
    const [showResult, setShowResult] = useState<string>('IMMEDIATELY');
    const [publishing, setPublishing] = useState(false);
    const [publishMsg, setPublishMsg] = useState<string | null>(null);

    const handleAttemptClick = async (attemptId: number) => {
        setSelectedAttemptId(attemptId);
        setLoadingViolations(true);
        try {
            const res = await api.get(`/attempt/${attemptId}/violations`);
            setViolations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingViolations(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const fetchResults = async () => {
            try {
                const res = await api.get(`/result/exam/${examId}`);
                if (res.data) {
                    setResults(res.data);
                }
            } catch (err: any) {
                console.error("Failed to fetch results", err);
                setError(err.response?.data?.message || "Failed to load results for this exam.");
            } finally {
                setIsLoading(false);
            }
        };

        const fetchSettings = async () => {
            try {
                const res = await api.get(`/settings/${examId}`);
                if (res.data?.showResult) {
                    setShowResult(res.data.showResult);
                }
            } catch (e) {
                // settings may not exist
            }
        };

        if (examId) {
            fetchResults();
            fetchSettings();
        }
    }, [examId, router]);

    return (
        <div className="min-h-screen bg-[#fdf8f3] font-sans text-[#23201a]">
            {/* Header */}
            <nav className="flex items-center justify-between px-8 py-4 border-b border-[#ece7df] bg-white">
                <h1 className="text-xl font-bold font-serif">Exam Results</h1>
                <Link href="/dashboard">
                    <button className="px-4 py-2 border border-[#ece7df] rounded-lg text-sm font-medium text-[#7c766a] hover:bg-[#f3f0e7] transition-colors font-sans">Back to Dashboard</button>
                </Link>
            </nav>

            <main className="max-w-5xl mx-auto px-4 py-10">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-extrabold tracking-tight font-serif mb-1">Candidate Leaderboard</h2>
                        <p className="mt-1 text-[#7c766a]">View all scores and submissions for this exam.</p>
                    </div>
                    {showResult === 'NEVER' && results.length > 0 && (
                        <button
                            onClick={async () => {
                                setPublishing(true);
                                setPublishMsg(null);
                                try {
                                    await api.post(`/settings/${examId}/publish-results`);
                                    setShowResult('IMMEDIATELY');
                                    setPublishMsg('Results published successfully! Students can now see their scores.');
                                    setTimeout(() => setPublishMsg(null), 5000);
                                } catch (e) {
                                    console.error(e);
                                    setPublishMsg('Failed to publish results.');
                                } finally {
                                    setPublishing(false);
                                }
                            }}
                            disabled={publishing}
                            className="px-6 py-3 bg-[#0e9e82] text-white font-bold rounded-xl shadow hover:bg-[#0b7e68] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {publishing ? 'Publishing...' : 'Publish Results'}
                        </button>
                    )}
                </div>

                {publishMsg && (
                    <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
                        publishMsg.includes('success') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        {publishMsg}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#59524d]"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 font-medium">
                        {error}
                    </div>
                ) : (
                    <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-[#ece7df]">
                        {results.length === 0 ? (
                            <div className="p-12 text-center text-[#7c766a]">
                                <svg className="mx-auto h-12 w-12 text-[#b3a89c] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                No candidates have attempted this exam yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[#ece7df]">
                                    <thead className="bg-[#f8f5f0]">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#7c766a] uppercase tracking-wider">Candidate Name / Email</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#7c766a] uppercase tracking-wider">Start Time</th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#7c766a] uppercase tracking-wider">End Time</th>
                                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-[#7c766a] uppercase tracking-wider">Score points</th>
                                            <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-[#7c766a] uppercase tracking-wider">Proctor Logs</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-[#f3f0e7]">
                                        {results.map((res, idx) => (
                                            <tr key={idx} className="hover:bg-[#f8f5f0] transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-[#23201a]">{res.studentName || 'Anonymous Student'}</div>
                                                    {res.studentEmail && (
                                                        <div className="text-xs text-[#0e9e82] mt-0.5">{res.studentEmail}</div>
                                                    )}
                                                    <div className="text-xs text-[#b3a89c] font-sans">Attempt #{res.attemptId}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-[#59524d]">
                                                        {res.startTime ? new Date(res.startTime).toLocaleString() : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-[#59524d]">
                                                        {res.endTime ? new Date(res.endTime).toLocaleString() : 'In Progress'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-black bg-[#ece7df] text-[#0e9e82] font-sans">
                                                        {res.score}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <button onClick={() => handleAttemptClick(res.attemptId)} className="text-[#0e9e82] hover:text-[#0b7e68] text-sm font-semibold underline">
                                                        View Logs
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Violations Modal */}
            {selectedAttemptId && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center bg-[#f8f5f0] rounded-t-2xl">
                            <h3 className="text-xl font-bold font-serif">Proctoring Details (Attempt #{selectedAttemptId})</h3>
                            <button onClick={() => setSelectedAttemptId(null)} className="text-[#b3a89c] hover:text-[#23201a] bg-[#ece7df] hover:bg-[#e6e1d6] rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto bg-[#f8f5f0] flex-1">
                            {loadingViolations ? (
                                <div className="text-center py-10 text-[#7c766a]">Loading logs...</div>
                            ) : violations.length === 0 ? (
                                <div className="text-center py-10 text-green-900 font-semibold bg-green-50 rounded-xl border border-green-200">
                                    No violations explicitly recorded! Student followed all monitored protocols.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {violations.map((v, i) => (
                                        <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-[#ece7df] relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                                            <div className="flex justify-between items-start mb-3 pl-2">
                                                <span className="font-bold text-red-600 text-sm tracking-wider">{v.type?.replace("_", " ")}</span>
                                                <span className="text-xs text-[#b3a89c]">{new Date(v.time).toLocaleString()}</span>
                                            </div>
                                            {v.message && (
                                                <p className="text-[#59524d] text-sm mt-2 mb-3 pl-2 border-l-2 border-[#ece7df] font-medium">{v.message}</p>
                                            )}
                                            {v.imageUrl && v.imageUrl.startsWith("data:image") ? (
                                                <img src={v.imageUrl} alt="Violation" className="mt-2 rounded-lg border border-[#ece7df] shadow-sm max-h-64 object-contain" />
                                            ) : v.imageUrl && !v.message ? (
                                                <p className="text-[#59524d] text-sm mt-2 pl-2 border-l-2 border-[#ece7df]">{v.imageUrl}</p>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
