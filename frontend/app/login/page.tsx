"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Parse Google OAuth redirect response hash if present
    if (typeof window !== "undefined" && window.location.hash) {
      const hashStr = window.location.hash.substring(1);
      window.history.replaceState(null, "", window.location.pathname);
      const params = new URLSearchParams(hashStr);
      const idToken = params.get("id_token") || params.get("access_token");
      if (idToken) {
        try {
          const base64Url = idToken.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);
          if (payload && payload.email) {
            setLoading(true);
            api.post("/auth/google", {
              idToken: idToken,
              email: payload.email,
              name: payload.name || payload.email.split("@")[0],
            })
              .then((res) => {
                const data = res.data;
                if (data.token) {
                  localStorage.clear();
                  localStorage.setItem("token", data.token);
                  localStorage.setItem("userEmail", data.email);
                  localStorage.setItem("userName", data.name);
                  if (data.role) localStorage.setItem("userRole", data.role);

                  setSuccess(`Welcome, ${data.name}! Google Login Successful.`);
                  setTimeout(() => {
                    if (data.role === "ADMINISTRATOR") {
                      router.push("/admin");
                    } else {
                      router.push("/dashboard");
                    }
                  }, 1000);
                }
              })
              .catch((err) => {
                console.error("Google Auth error:", err);
                setError("Google Authentication failed. Please try again.");
              })
              .finally(() => setLoading(false));
          }
        } catch (e) {
          console.error("Failed to parse Google OAuth ID Token:", e);
        }
      }
    }
  }, [router]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data;

      if (data.token) {
        localStorage.clear();
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.email);
        localStorage.setItem("userName", data.name);
        if (data.role) localStorage.setItem("userRole", data.role);
      }

      setSuccess(`Welcome, ${data.name || "back"}!`);
      setTimeout(() => {
        router.push("/");
      }, 1200);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-sky-100 rounded-xl shadow-md p-8">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-sky-600 inline-block mb-1">
            ✈️ TripNest
          </Link>
          <h2 className="text-xl font-bold text-slate-800">Login to Your Account</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-600 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md text-sm shadow-sm transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="my-5 flex items-center justify-center gap-3">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">or</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        <GoogleLoginButton buttonText="Sign in with Google" />

        <div className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{" "}
          <Link href="/register" className="text-sky-600 hover:underline font-semibold">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
