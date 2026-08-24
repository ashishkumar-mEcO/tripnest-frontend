"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

interface Destination {
  id: number;
  name: string;
  country: string;
  description: string;
  weatherInfo: string;
  isPopular: boolean;
}

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedName = localStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }

    api.get("/destinations")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setDestinations(res.data);
        }
      })
      .catch((err) => console.log("Error loading destinations:", err));
  }, []);

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-sky-600 to-sky-700 text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Explore Beautiful Destinations & Plan Your Trip
          </h1>
          <p className="text-sky-100 text-base mb-6">
            Your simple travel companion to find places, organize schedules, and manage your trips effortlessly.
          </p>

          {userName ? (
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/dashboard"
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-xl text-sm shadow-md transition"
              >
                📊 Go to Dashboard
              </Link>
              <Link
                href="/destinations"
                className="bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-3 rounded-xl text-sm border border-white/40 shadow-md transition"
              >
                🌤️ Browse Weather & Destinations
              </Link>
              <Link
                href="/trips"
                className="bg-sky-800/80 hover:bg-sky-900 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md transition"
              >
                ✈️ Manage Trips
              </Link>
            </div>
          ) : (
            <Link
              href="/register"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-xl text-sm shadow-md transition"
            >
              Start Your Journey Free
            </Link>
          )}
        </div>
      </section>

      {/* Destinations List */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-sky-900">Popular Travel Destinations</h2>
            <p className="text-slate-600 text-sm">Discover top places for your next trip:</p>
          </div>

          <Link
            href="/destinations"
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            View Live Weather & All Destinations →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="bg-white border border-sky-100 rounded-xl p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-sky-900">{dest.name}</h3>
                  <span className="text-xs text-sky-600 font-medium">📍 {dest.country}</span>
                </div>
                {dest.isPopular && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    ★ Popular
                  </span>
                )}
              </div>

              <p className="text-slate-600 text-xs mb-3 line-clamp-3">{dest.description}</p>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
                <span>Weather: <strong className="text-slate-700">{dest.weatherInfo}</strong></span>
                <Link href="/destinations" className="text-sky-600 font-bold hover:underline">
                  Check Weather ➔
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
