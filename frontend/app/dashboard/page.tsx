"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

interface Trip {
  id: number;
  title: string;
  destinationName: string;
  startDate: string;
  endDate: string;
  numberOfTravellers: number;
  budget: number;
  status: string;
}

interface Destination {
  id: number;
  name: string;
  country: string;
  description: string;
  weatherInfo: string;
  isPopular: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("Traveler");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName);

    // Fetch user's trips (Travel History)
    api.get("/trips/my-trips")
      .then((res) => {
        if (Array.isArray(res.data)) setTrips(res.data);
      })
      .catch((err) => console.error("Error fetching trips:", err));

    // Fetch popular destinations
    api.get("/destinations/popular")
      .then((res) => {
        if (Array.isArray(res.data)) setPopularDestinations(res.data);
      })
      .catch((err) => console.error("Error fetching popular destinations:", err))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-3xl p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="bg-sky-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-sky-400/30">
              User Dashboard
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-2">
              Welcome back, {userName}! 👋
            </h1>
            <p className="text-sky-100 text-sm mt-1 max-w-xl">
              Manage your travel history, upcoming itineraries, saved destinations, and personal preferences all in one place.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/trips"
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-5 py-3 rounded-xl text-xs shadow-md transition flex items-center gap-2"
            >
              ➕ Create New Trip
            </Link>
            <Link
              href="/profile"
              className="bg-sky-700/70 hover:bg-sky-800 text-white font-semibold px-4 py-3 rounded-xl text-xs border border-sky-400/40 transition"
            >
              ⚙️ Account Settings
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Travel History</span>
              <span className="text-2xl">✈️</span>
            </div>
            <p className="text-3xl font-black text-sky-900">{trips.length}</p>
            <span className="text-xs text-sky-600 font-medium">Trips created in system</span>
          </div>

          <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Trips</span>
              <span className="text-2xl">🗓️</span>
            </div>
            <p className="text-3xl font-black text-amber-600">
              {trips.filter((t) => t.status === "UPCOMING" || t.status === "PLANNED").length}
            </p>
            <span className="text-xs text-amber-700 font-medium">Scheduled itineraries</span>
          </div>

          <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Popular Destinations</span>
              <span className="text-2xl">🌟</span>
            </div>
            <p className="text-3xl font-black text-emerald-600">{popularDestinations.length}</p>
            <span className="text-xs text-emerald-700 font-medium">Featured global spots</span>
          </div>
        </div>

        {/* 2-Column Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Travel History & Recent Trips */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-sky-900">Your Travel History</h2>
                  <p className="text-xs text-slate-500">Your personal travel logs and upcoming plans</p>
                </div>
                <Link href="/trips" className="text-xs font-bold text-sky-600 hover:text-sky-800">
                  View All Trips →
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading your travel history...</div>
              ) : trips.length === 0 ? (
                <div className="py-10 text-center bg-sky-50/50 rounded-2xl border border-dashed border-sky-200">
                  <span className="text-3xl">🗺️</span>
                  <p className="text-sm font-bold text-sky-900 mt-2">No trips created yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    Start planning your dream vacation by creating your first trip itinerary!
                  </p>
                  <Link
                    href="/trips"
                    className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
                  >
                    + Create First Trip
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {trips.slice(0, 3).map((trip) => (
                    <div
                      key={trip.id}
                      className="p-5 rounded-2xl border border-sky-100 bg-sky-50/50 hover:bg-sky-50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-sky-950">{trip.title}</h3>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              trip.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800"
                                : trip.status === "UPCOMING"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {trip.status || "PLANNED"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          📍 {trip.destinationName || "Custom Destination"} · {trip.startDate} to {trip.endDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-700">
                          {trip.budget ? `₹${trip.budget}` : "Flexible Budget"}
                        </span>
                        <Link
                          href={`/trips/${trip.id}`}
                          className="bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          Details & Itinerary →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right 1 Col: Featured Popular Destinations */}
          <div className="space-y-6">
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-sky-900">Featured Places</h2>
                <Link href="/destinations" className="text-xs font-bold text-sky-600 hover:text-sky-800">
                  Explore →
                </Link>
              </div>

              <div className="space-y-4">
                {popularDestinations.map((dest) => (
                  <div key={dest.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-bold text-sky-900">{dest.name}</h4>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ★ Popular
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">📍 {dest.country}</p>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{dest.description}</p>
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-between items-center text-[11px] text-slate-500">
                      <span>🌤️ {dest.weatherInfo || "Sunny / Mild"}</span>
                      <Link href="/destinations" className="text-sky-600 font-bold hover:underline">
                        View Weather ➔
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
