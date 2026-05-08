"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/app/api/axios";
import { Button } from "@/components/ui/button"

export default function Dashboard() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [conductedExams, setConductedExams] = useState<any[]>([]);
    const [takenExams, setTakenExams] = useState<any[]>([]);
    // Pagination state
    const PAGE_SIZE = 10;
    const [conductedPage, setConductedPage] = useState(1);
    const [takenPage, setTakenPage] = useState(1);
    // Paginated data
    const paginatedConducted = conductedExams.slice((conductedPage - 1) * PAGE_SIZE, conductedPage * PAGE_SIZE);
    const paginatedTaken = takenExams.slice((takenPage - 1) * PAGE_SIZE, takenPage * PAGE_SIZE);
    const conductedTotalPages = Math.ceil(conductedExams.length / PAGE_SIZE);
    const takenTotalPages = Math.ceil(takenExams.length / PAGE_SIZE);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        const fetchDashboardData = async () => {
            try {
                // Fetch conducted exams from backend
                const examsRes = await api.get('/exam/my-exams');
                if (examsRes.data) {
                    setConductedExams(examsRes.data.map((e: any) => ({
                        id: e.id,
                        title: e.title,
                        participants: e.participants,
                        date: "Active"
                    })));
                }

                // Fetch taken exams (attempts) from backend
                const attemptsRes = await api.get('/attempt/my-attempts');
                if (attemptsRes.data) {
                    setTakenExams(attemptsRes.data.map((a: any) => ({
                        id: a.examId,
                        title: a.title,
                        score: a.score,
                        date: a.dateTaken ? new Date(a.dateTaken).toLocaleDateString() : 'N/A'
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();

    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdf8f3] font-sans text-[#23201a]">
            {/* Header */}
            <nav className="flex items-center justify-between px-8 py-4 border-b border-[#ece7df] bg-white">
                <div className="flex items-center gap-8">
                    <span className="scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0">Online Proctoring System</span>

                </div>
                <div className="flex items-center gap-6">

                    {/* <button onClick={handleLogout} className="text-sm text-[#090908]  font-medium font-sans hover:bg-gray-100 p-1 rounded-sm">Logout</button> */}
                    <Button onClick={handleLogout} variant="destructive">Logout</Button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-12">
                <h1 className="text-5xl font-extrabold mb-2 mt-2 font-serif">Exam Dashboard</h1>
                <p className="text-[#7c766a] mb-10 max-w-2xl">Welcome back to your academic workspace. Manage your conducted assessments and review your examination history from a unified editorial interface.</p>
                <div className="mb-8  sm:flex-row sm:justify-end">
                    <Link href="/create-exam">
                        <button className="px-8 py-3 bg-[#59524d] text-white rounded-xl shadow hover:bg-[#463f3a] font-semibold text-base transition-all duration-200">
                            + Conduct an Exam
                        </button>
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Conducted Exams */}
                    <section>
                        <h2 className="text-2xl font-bold mb-4 font-serif">Exams You Conducted</h2>
                        <div className="bg-white rounded-2xl border border-[#ece7df] shadow-sm">
                            <ul>
                                {paginatedConducted.length === 0 ? (
                                    <li className="p-8 text-center text-[#7c766a]">No exams conducted yet.</li>
                                ) : (
                                    paginatedConducted.map((exam) => (
                                        <li key={exam.id} className="flex items-center justify-between px-6 py-3 border-b border-[#f3f0e7] last:border-b-0">
                                            <div>
                                                <div className="font-semibold flex items-center gap-2">
                                                    <Link href={`/dashboard/exam/${exam.id}`} className="hover:underline flex items-center gap-1">
                                                        {exam.title}
                                                        <svg className="w-4 h-4 text-[#b3a89c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                    </Link>
                                                </div>
                                                <div className="text-xs text-[#7c766a] font-sans">Status Active</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-3 py-1 rounded-full bg-[#e6e1d6] text-[#59524d] text-xs font-semibold min-w-[90px] text-center font-sans">{exam.participants || 0} Participants</span>
                                                <Link href={`/dashboard/exam/${exam.id}`}><button className="px-4 py-1 rounded-lg bg-[#59524d] text-white font-semibold text-xs hover:bg-[#463f3a] font-sans">Details</button></Link>
                                                <Link href={`/dashboard/results/${exam.id}`}><button className="px-4 py-1 rounded-lg bg-[#0e9e82] text-white font-semibold text-xs hover:bg-[#0b7e68] flex items-center gap-1 font-sans">Results <span className="ml-1">→</span></button></Link>
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                            {/* Pagination for conducted exams */}
                            {conductedTotalPages > 1 && (
                                <div className="flex justify-center gap-2 py-4">
                                    <button onClick={() => setConductedPage(p => Math.max(1, p - 1))} disabled={conductedPage === 1} className="px-3 py-1 rounded bg-[#ece7df] text-[#7c766a] disabled:opacity-50">Prev</button>
                                    <span className="px-2">Page {conductedPage} of {conductedTotalPages}</span>
                                    <button onClick={() => setConductedPage(p => Math.min(conductedTotalPages, p + 1))} disabled={conductedPage === conductedTotalPages} className="px-3 py-1 rounded bg-[#ece7df] text-[#7c766a] disabled:opacity-50">Next</button>
                                </div>
                            )}
                        </div>
                    </section>
                    {/* Taken Exams */}
                    <section>
                        <h2 className="text-2xl font-bold mb-4 font-serif">Exams You've Taken</h2>
                        <div className="bg-white rounded-2xl border border-[#ece7df] shadow-sm">
                            <ul>
                                {paginatedTaken.length === 0 ? (
                                    <li className="p-8 text-center text-[#7c766a]">You haven't taken any exams yet.</li>
                                ) : (
                                    paginatedTaken.map((exam, idx) => (
                                        <li key={idx} className="flex items-center justify-between px-6 py-3 border-b border-[#f3f0e7] last:border-b-0">
                                            <div>
                                                <div className="font-semibold">{exam.title}</div>
                                                <div className="text-xs text-[#7c766a] font-sans">Attempted on {exam.date}</div>
                                            </div>
                                            <div className="text-right min-w-[90px]">
                                                {exam.score === -1 ? (
                                                    <>
                                                        <span className="block text-sm font-bold text-amber-600 font-sans">Pending</span>
                                                        <span className="text-xs text-amber-400 font-medium font-sans">AWAITING RESULTS</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="block text-lg font-black text-[#0e9e82]">{exam.score}</span>
                                                        <span className="text-xs text-[#b3a89c] font-medium uppercase tracking-wide font-sans">FINAL POINTS</span>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                            {/* Pagination for taken exams */}
                            {takenTotalPages > 1 && (
                                <div className="flex justify-center gap-2 py-4">
                                    <button onClick={() => setTakenPage(p => Math.max(1, p - 1))} disabled={takenPage === 1} 
                                    className="px-3 py-1 rounded bg-[#ece7df] text-[#7c766a] disabled:opacity-50">
                                        Prev
                                    </button>
                                    <span className="px-2">Page {takenPage} of {takenTotalPages}</span>
                                    <button onClick={() => setTakenPage(p => Math.min(takenTotalPages, p + 1))} 
                                    disabled={takenPage === takenTotalPages} 
                                    className="px-3 py-1 rounded bg-[#ece7df] text-[#7c766a] disabled:opacity-50">
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
