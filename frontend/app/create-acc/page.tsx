"use client"

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterContent() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [confirmPass, setConfirmPass] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect");

    const handleSignup = async(e: React.FormEvent) => {
        e.preventDefault();
        if(password !== confirmPass) {
            setError("Passwords do not match");
            return;
        }
        setError("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8080/proctor/login/signup", {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    name: name,
                    password: password
                })
            });

            if(!res.ok) {
                throw new Error("Registration failed");
            }

            // Immediately login the user implicitly or just redirect to login to ensure token
            const loginUrl = redirectUrl ? `/login?redirect=${redirectUrl}` : `/login`;
            router.push(loginUrl);
            
        } catch(e) {
            console.error("Signup error: ", e);
            setError("Failed to create account. Email may already be in use.");
        } finally {
            setLoading(false);
        }
    }

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
                    <p className="mt-1 text-sm text-slate-600 font-sans">Register for a new account.</p>
                </div>
                <form className="mt-6 space-y-6" onSubmit={handleSignup}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">Full Name</label>
                            <input
                                type="text"
                                required
                                className="block w-full px-4 py-3 bg-[#eae6dd] border border-transparent rounded-md focus:ring-2 focus:ring-green-900 focus:border-green-900 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="Priyanshu"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
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
                            <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">Password</label>
                            <input
                                type="password"
                                required
                                className="block w-full px-4 py-3 bg-[#eae6dd] border border-transparent rounded-md focus:ring-2 focus:ring-green-900 focus:border-green-900 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1 font-sans">Confirm Password</label>
                            <input
                                type="password"
                                required
                                className="block w-full px-4 py-3 bg-[#eae6dd] border border-transparent rounded-md focus:ring-2 focus:ring-green-900 focus:border-green-900 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="••••••••"
                                value={confirmPass}
                                onChange={(e) => setConfirmPass(e.target.value)}
                            />
                        </div>
                    </div>
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium font-sans">
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3.5 px-4 rounded-md shadow-sm text-base font-semibold text-white bg-[#59524d] hover:bg-[#463f3a] focus:outline-none transition-all disabled:opacity-70"
                    >
                        {loading ? "Creating Account..." : (<span className="flex items-center gap-2">Create Account <span className="ml-1">⇨</span></span>)}
                    </button>
                    <div className="text-center mt-2">
                        <span className="text-slate-500 text-sm font-sans">Already registered? </span>
                        <Link href={redirectUrl ? `/login?redirect=${redirectUrl}` : `/login`} className="text-green-900 font-semibold hover:underline">Log in here</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Account() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div></div>}>
            <RegisterContent />
        </Suspense>
    );
}