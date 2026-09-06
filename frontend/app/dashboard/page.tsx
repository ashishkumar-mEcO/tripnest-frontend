"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

interface TripResponse {
  id: number;
  title: string;
  destinationName: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  numberOfTravellers: number;
  budget: number;
  spent: number;
  status: string;
}

interface BudgetOverview {
  totalBudgeted: number;
  totalSpent: number;
}

interface CategorySummaryDto {
  category: string;
  totalAmount: number;
  percentage: number;
}

interface DestinationVisitDto {
  id: number;
  name: string;
  country: string;
  visitCount: number;
}

interface BasicStats {
  totalTrips: number;
  totalDestinations: number;
  totalSpent: number;
}

interface TravelerDashboardData {
  upcomingTrips: TripResponse[];
  budgetOverview: BudgetOverview;
  expenseSummary: CategorySummaryDto[];
  favoriteDestinations: DestinationVisitDto[];
  basicStats: BasicStats;
}

const CATEGORY_COLORS: Record<string, string> = {
  Hotel: "#0284c7",
  Food: "#10b981",
  Transportation: "#f59e0b",
  Activities: "#8b5cf6",
  Shopping: "#ec4899",
  Miscellaneous: "#64748b",
};

export default function TravelerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<TravelerDashboardData | null>(null);
  const [userName, setUserName] = useState<string>("Traveler");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const role = localStorage.getItem("userRole");
    if (role === "ADMINISTRATOR") {
      router.replace("/admin");
      return;
    }

    const storedName = localStorage.getItem("userName");
    if (storedName) setUserName(storedName);

    // Single Aggregated API Call
    api
      .get("/dashboard/traveler")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Failed to load traveler dashboard:", err);
        setError("Failed to load dashboard statistics. Please try refreshing.");
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Donut chart calculation for Budget Overview
  const totalBudgeted = data?.budgetOverview.totalBudgeted || 0;
  const totalSpent = data?.budgetOverview.totalSpent || 0;
  const remainingBudget = Math.max(0, totalBudgeted - totalSpent);
  const percentSpent = totalBudgeted > 0 ? Math.min(100, Math.round((totalSpent / totalBudgeted) * 100)) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-sky-500/30 text-sky-200 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-sky-400/30">
              ✈️ Traveler Dashboard
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
              Welcome back, {userName}!
            </h1>
            <p className="text-sky-100/90 text-sm mt-1.5 max-w-xl font-medium">
              Here is your combined travel statistics, budget breakdown, upcoming trips, and favorite destinations across all your journeys.
            </p>
          </div>

          <div className="flex gap-3 relative z-10 shrink-0">
            <Link
              href="/trips"
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs shadow-lg transition transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              ➕ Create New Trip
            </Link>
            <Link
              href="/destinations"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-3 rounded-2xl text-xs backdrop-blur-md border border-white/20 transition"
            >
              🌍 Explore Spots
            </Link>
          </div>

          {/* Background Decorative Graphic */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-4 rounded-2xl">
            ⚠️ {error}
          </div>
        )}

        {/* Component Five: Basic Travel Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Trips Taken</span>
              <p className="text-3xl font-black text-sky-950 mt-1">
                {loading ? "..." : data?.basicStats.totalTrips || 0}
              </p>
              <span className="text-[11px] text-sky-600 font-semibold mt-0.5 block">Joined & Created Trips</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 text-2xl flex items-center justify-center font-bold">
              🗺️
            </div>
          </div>

          <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Destinations Visited</span>
              <p className="text-3xl font-black text-indigo-950 mt-1">
                {loading ? "..." : data?.basicStats.totalDestinations || 0}
              </p>
              <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 block">Unique Travel Spots</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-2xl flex items-center justify-center font-bold">
              📍
            </div>
          </div>

          <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Amount Spent</span>
              <p className="text-3xl font-black text-emerald-950 mt-1">
                ₹{loading ? "..." : (data?.basicStats.totalSpent || 0).toLocaleString()}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Across All Trips Combined</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-2xl flex items-center justify-center font-bold">
              💳
            </div>
          </div>
        </div>

        {/* 2-Column Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (7 cols): Budget Overview & Expense Summary */}
          <div className="lg:col-span-7 space-y-8">
            {/* Component Two: Budget Overview Card & Progress */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-sky-950 flex items-center gap-2">
                    💰 Budget Overview
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Aggregated total budget vs total spent across all your trips</p>
                </div>
                <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                  {percentSpent}% Spent
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400">Total Budgeted</span>
                  <p className="text-xl font-black text-sky-950 mt-1">₹{totalBudgeted.toLocaleString()}</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[10px] uppercase font-extrabold text-emerald-800">Total Spent</span>
                  <p className="text-xl font-black text-emerald-950 mt-1">₹{totalSpent.toLocaleString()}</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
                  <span className="text-[10px] uppercase font-extrabold text-amber-800">Remaining</span>
                  <p className="text-xl font-black text-amber-950 mt-1">₹{remainingBudget.toLocaleString()}</p>
                </div>
              </div>

              {/* Combined Budget Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Spent: ₹{totalSpent.toLocaleString()}</span>
                  <span>Budget: ₹{totalBudgeted.toLocaleString()}</span>
                </div>
                <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${percentSpent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Component Three: Expense Summary (Category Breakdown Across All Trips) */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-sky-950 flex items-center gap-2">
                    📊 Expense Category Breakdown
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Combined category expenditure across all trips</p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {data?.expenseSummary.length || 0} Categories
                </span>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading expense summary...</div>
              ) : !data?.expenseSummary || data.expenseSummary.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                  No expenses logged across trips yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.expenseSummary.map((cat) => {
                    const color = CATEGORY_COLORS[cat.category] || "#0284c7";
                    return (
                      <div key={cat.category} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <span>{cat.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sky-950 font-black">₹{cat.totalAmount.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                              {cat.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, cat.percentage)}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Component One: Upcoming Trips & Component Four: Favorite Destinations */}
          <div className="lg:col-span-5 space-y-8">
            {/* Component One: Upcoming Trips */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-black text-sky-950 flex items-center gap-2">
                    🗓️ Upcoming Trips
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Sorted soonest first</p>
                </div>
                <Link href="/trips" className="text-xs font-extrabold text-sky-600 hover:text-sky-800">
                  View All →
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading upcoming trips...</div>
              ) : !data?.upcomingTrips || data.upcomingTrips.length === 0 ? (
                <div className="py-8 text-center bg-sky-50/50 rounded-2xl border border-dashed border-sky-200">
                  <span className="text-3xl">🌴</span>
                  <p className="text-xs font-bold text-sky-950 mt-2">No upcoming trips scheduled</p>
                  <p className="text-[11px] text-slate-500 mt-1 mb-3">Plan your next trip start date in the future!</p>
                  <Link
                    href="/trips"
                    className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs"
                  >
                    + Create Upcoming Trip
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.upcomingTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-4 rounded-2xl border border-sky-100 bg-sky-50/40 hover:bg-sky-50 transition flex flex-col justify-between space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black text-sky-950">{trip.title}</h4>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            📍 {trip.destinationName || "Custom Destination"}
                          </p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full">
                          {trip.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-2 border-t border-sky-100/60">
                        <span className="font-bold text-slate-600">📅 {trip.startDate}</span>
                        <Link
                          href={`/trips/${trip.id}`}
                          className="bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 text-xs font-bold px-3 py-1 rounded-xl transition"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Component Four: Favorite / Most-Visited Destinations */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-black text-sky-950 flex items-center gap-2">
                    ⭐ Most-Visited Destinations
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Ranked by your visit count</p>
                </div>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading favorite destinations...</div>
              ) : !data?.favoriteDestinations || data.favoriteDestinations.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                  No visited destinations recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.favoriteDestinations.map((dest, idx) => (
                    <div
                      key={dest.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0 border border-amber-200">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-sky-950">{dest.name}</h4>
                          <p className="text-xs text-slate-500 font-medium">📍 {dest.country}</p>
                        </div>
                      </div>

                      <span className="bg-sky-100 text-sky-900 text-xs font-black px-3 py-1 rounded-full border border-sky-200">
                        {dest.visitCount} {dest.visitCount === 1 ? "Trip" : "Trips"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
