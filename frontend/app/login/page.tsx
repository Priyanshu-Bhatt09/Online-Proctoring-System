"use client"

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch("http://localhost:8080/proctor/login/signin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error("Invalid credentials");
            }

            const data = await response.json();
            localStorage.setItem("token", data.token);
            
            if (redirectUrl) {
                router.push(redirectUrl);
            } else {
                router.push('/dashboard');
            }
        } catch (error) {
            console.error("Login error", error);
            alert("Failed to login. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdf8f3] text-slate-800 font-sans p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-3xl shadow-xl border border-slate-100">
                <div className="flex flex-col items-center">
                    <div className="mx-auto h-12 w-12 bg-[#f3f0e7] rounded-full flex items-center justify-center mb-4">
                        <svg className="h-7 w-7 text-green-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            
                            <image href="/test.png" width="24" height="24" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-serif font-semibold text-slate-900">Online Proctoring System</h2>
                    <p className="mt-1 text-sm text-slate-600 font-sans">Secure Authentication</p>
                </div>
                <form className="mt-6 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">Email</label>
                            <input
                                type="email"
                                required
                                className="block w-full px-4 py-3 bg-[#eae6dd] border border-transparent rounded-md focus:ring-2 focus:ring-green-900 focus:border-green-900 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-medium text-slate-700 font-sans">Password</label>
                                
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full px-4 py-3 bg-[#eae6dd] border border-transparent rounded-md focus:ring-2 focus:ring-green-900 focus:border-green-900 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3.5 px-4 rounded-md shadow-sm text-base font-semibold text-white bg-[#59524d] hover:bg-[#463f3a] focus:outline-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? "Signing in..." : (<span className="flex items-center gap-2">Sign In <span className="ml-1">⇨</span></span>)}
                    </button>
                    <div className="text-center mt-2">
                        <span className="text-slate-500 text-sm font-sans">Don't have an account? </span>
                        <Link href="/create-acc" className="text-green-900 font-semibold hover:underline">Register here.</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Login() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>}>
            <LoginContent />
        </Suspense>
    );
}