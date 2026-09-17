"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (token) {
      if (role === "ADMINISTRATOR") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center">
      <div className="animate-pulse text-sky-900 font-bold text-sm flex items-center gap-2">
        <span>✈️</span>
        <span>Redirecting to Dashboard...</span>
      </div>
    </div>
  );
}
