"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const name = localStorage.getItem("userName");
    setUserName(name);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setUserName(null);
    router.push("/login");
  };

  const navLinks = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "My Trips", href: "/trips" },
    { name: "Destinations", href: "/destinations" },
    { name: "Profile", href: "/profile" },
  ];

  return (
    <header className="bg-sky-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-extrabold tracking-wide flex items-center gap-2">
          ✈️ <span className="text-white">Trip</span><span className="text-amber-400">Nest</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold transition ${
                pathname === link.href ? "text-amber-300 underline underline-offset-4 font-bold" : "text-sky-100 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {userName ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-sky-700 text-sky-100 px-3 py-1.5 rounded-full border border-sky-500">
                👤 {userName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold hover:underline">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-md text-xs font-bold shadow-sm transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
