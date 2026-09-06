"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

interface UserAnalytics {
  totalUsers: number;
}

interface TripAnalytics {
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
}

interface DestinationPopularityDto {
  destinationId: number;
  name: string;
  country: string;
  tripCount: number;
}

interface PlatformStats {
  totalPlatformExpenses: number;
  totalNotificationsSent: number;
}

interface AdminDashboardData {
  userAnalytics: UserAnalytics;
  tripAnalytics: TripAnalytics;
  destinationAnalytics: DestinationPopularityDto[];
  platformStats: PlatformStats;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch Admin Dashboard analytics (4 components)
    api
      .get("/dashboard/admin")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Admin dashboard access error:", err);
        const errorMsg = err.response?.data?.message || err.response?.data?.error || "Access denied. Administrator privileges required.";
        setError(errorMsg);
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-amber-400/30 text-amber-100 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-amber-300/30">
              🛡️ System Administrator Dashboard
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-3 tracking-tight">
              Platform Analytics & Governance
            </h1>
            <p className="text-amber-100/90 text-sm mt-1.5 max-w-xl font-medium">
              Monitor platform user analytics, active & completed trip statistics, popular travel destinations, and overall platform metrics.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center relative z-10 shrink-0">
            <span className="text-[10px] uppercase font-extrabold text-amber-200">Access Control Level</span>
            <p className="text-sm font-black text-white mt-0.5">👑 Administrator</p>
          </div>
        </div>

        {error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 rounded-3xl text-center space-y-3 shadow-xs">
            <span className="text-4xl">🛑</span>
            <h3 className="text-lg font-black text-rose-950">Access Restricted</h3>
            <p className="text-xs font-semibold max-w-md mx-auto">{error}</p>
          </div>
        ) : (
          <>
            {/* Component One & Four: User Analytics & Platform Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Component One: User Analytics */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Registered Users</span>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {loading ? "..." : data?.userAnalytics.totalUsers || 0}
                  </p>
                  <span className="text-[10px] text-sky-600 font-bold mt-0.5 block">Platform-wide Accounts</span>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-sky-50 border border-sky-100 text-sky-600 text-2xl flex items-center justify-center font-bold">
                  👥
                </div>
              </div>

              {/* Component Two: Trip Analytics (Total Trips) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Trips Created</span>
                  <p className="text-3xl font-black text-amber-600 mt-1">
                    {loading ? "..." : data?.tripAnalytics.totalTrips || 0}
                  </p>
                  <span className="text-[10px] text-amber-700 font-bold mt-0.5 block">Across All Travelers</span>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 text-2xl flex items-center justify-center font-bold">
                  ✈️
                </div>
              </div>

              {/* Component Four: Platform Stats - Total Expenses */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Expenses Logged</span>
                  <p className="text-2xl font-black text-emerald-950 mt-1">
                    ₹{loading ? "..." : (data?.platformStats.totalPlatformExpenses || 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">Platform Expenditure</span>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-2xl flex items-center justify-center font-bold">
                  💳
                </div>
              </div>

              {/* Component Four: Platform Stats - Total Notifications */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Notifications Sent</span>
                  <p className="text-3xl font-black text-purple-950 mt-1">
                    {loading ? "..." : data?.platformStats.totalNotificationsSent || 0}
                  </p>
                  <span className="text-[10px] text-purple-600 font-bold mt-0.5 block">Triggered Alerts</span>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 text-2xl flex items-center justify-center font-bold">
                  🔔
                </div>
              </div>
            </div>

            {/* Main Analytics Grid: Component Two (Trip Analytics) & Component Three (Destination Analytics) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Component Two: Trip Analytics (Active vs Completed Trips) */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      📈 Trip Status Analytics
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">Active itineraries vs completed historical trips</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {data?.tripAnalytics.totalTrips || 0} Total
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800">Active / Planned Trips</span>
                    <p className="text-4xl font-black text-emerald-950">{data?.tripAnalytics.activeTrips || 0}</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                      Ongoing & Upcoming
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50 border border-slate-200 text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-sky-800">Completed Trips</span>
                    <p className="text-4xl font-black text-sky-950">{data?.tripAnalytics.completedTrips || 0}</p>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full inline-block">
                      Archived & Finished
                    </span>
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Active Ratio</span>
                    <span>
                      {data?.tripAnalytics.totalTrips
                        ? Math.round(((data.tripAnalytics.activeTrips || 0) / data.tripAnalytics.totalTrips) * 100)
                        : 0}
                      % Active
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200">
                    <div
                      className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                      style={{
                        width: `${
                          data?.tripAnalytics.totalTrips
                            ? ((data.tripAnalytics.activeTrips || 0) / data.tripAnalytics.totalTrips) * 100
                            : 0
                        }%`,
                      }}
                    />
                    <div
                      className="h-full bg-sky-500 rounded-r-full transition-all duration-500"
                      style={{
                        width: `${
                          data?.tripAnalytics.totalTrips
                            ? ((data.tripAnalytics.completedTrips || 0) / data.tripAnalytics.totalTrips) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Component Three: Destination Analytics (Most Popular Destinations Platform-Wide) */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      🌟 Destination Analytics
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">Most popular destinations based on trip creation</p>
                  </div>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading destination analytics...</div>
                ) : !data?.destinationAnalytics || data.destinationAnalytics.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                    No destination trips logged yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.destinationAnalytics.map((dest, idx) => (
                      <div
                        key={dest.destinationId}
                        className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{dest.name}</h4>
                            <p className="text-xs text-slate-500 font-medium">📍 {dest.country}</p>
                          </div>
                        </div>

                        <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full border border-amber-200">
                          {dest.tripCount} {dest.tripCount === 1 ? "Trip Created" : "Trips Created"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
