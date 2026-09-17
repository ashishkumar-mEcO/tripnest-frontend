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

interface RegisteredUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface PlatformTrip {
  id: number;
  title: string;
  ownerId: number;
  ownerName: string;
  destinationId: number | null;
  destinationName: string | null;
  destinationCountry: string | null;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  status: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Users Modal State
  const [usersModalOpen, setUsersModalOpen] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<RegisteredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>("");

  // Trips Modal State
  const [tripsModalOpen, setTripsModalOpen] = useState<boolean>(false);
  const [tripsList, setTripsList] = useState<PlatformTrip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState<boolean>(false);
  const [tripSearch, setTripSearch] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch Admin Dashboard analytics
    api
      .get("/dashboard/admin")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Admin dashboard access error:", err);
        const errorMsg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Access denied. Administrator privileges required.";
        setError(errorMsg);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const openUsersModal = () => {
    setUsersModalOpen(true);
    setLoadingUsers(true);
    api
      .get<RegisteredUser[]>("/admin/users")
      .then((res) => {
        setUsersList(res.data);
      })
      .catch((err) => {
        console.error("Error fetching registered users:", err);
      })
      .finally(() => setLoadingUsers(false));
  };

  const openTripsModal = () => {
    setTripsModalOpen(true);
    setLoadingTrips(true);
    api
      .get<PlatformTrip[]>("/admin/trips")
      .then((res) => {
        setTripsList(res.data);
      })
      .catch((err) => {
        console.error("Error fetching trips from admin API, attempting fallback:", err);
        api
          .get<PlatformTrip[]>("/trips/search?title=")
          .then((res) => setTripsList(res.data))
          .catch((e) => console.error("Fallback search failed:", e));
      })
      .finally(() => setLoadingTrips(false));
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toString().includes(userSearch)
  );

  const filteredTrips = tripsList.filter(
    (t) =>
      t.title.toLowerCase().includes(tripSearch.toLowerCase()) ||
      (t.ownerName && t.ownerName.toLowerCase().includes(tripSearch.toLowerCase())) ||
      (t.destinationName && t.destinationName.toLowerCase().includes(tripSearch.toLowerCase())) ||
      (t.status && t.status.toLowerCase().includes(tripSearch.toLowerCase()))
  );

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
            {/* Upper Stats Grid: Total Users, Total Trips, Total Expenses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Component One: Total Registered Users (Clickable Modal Trigger) */}
              <div
                onClick={openUsersModal}
                className="bg-white border border-slate-200 hover:border-sky-300 rounded-3xl p-6 shadow-xs flex items-center justify-between cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider group-hover:text-sky-600 transition-colors">
                      Total Registered Users
                    </span>
                    <span className="text-xs text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      ↗
                    </span>
                  </div>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {loading ? "..." : data?.userAnalytics.totalUsers || 0}
                  </p>
                  <span className="text-[10px] text-sky-600 font-bold mt-0.5 block">
                    Click to view all users 🔍
                  </span>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-sky-50 group-hover:bg-sky-100 border border-sky-100 text-sky-600 text-2xl flex items-center justify-center font-bold transition-colors">
                  👥
                </div>
              </div>

              {/* Component Two: Total Trips Created (Clickable Modal Trigger) */}
              <div
                onClick={openTripsModal}
                className="bg-white border border-slate-200 hover:border-amber-300 rounded-3xl p-6 shadow-xs flex items-center justify-between cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] group"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider group-hover:text-amber-600 transition-colors">
                      Total Trips Created
                    </span>
                    <span className="text-xs text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      ↗
                    </span>
                  </div>
                  <p className="text-3xl font-black text-amber-600 mt-1">
                    {loading ? "..." : data?.tripAnalytics.totalTrips || 0}
                  </p>
                  <span className="text-[10px] text-amber-700 font-bold mt-0.5 block">
                    Click to view all trips ✈️
                  </span>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-amber-50 group-hover:bg-amber-100 border border-amber-100 text-amber-600 text-2xl flex items-center justify-center font-bold transition-colors">
                  ✈️
                </div>
              </div>

              {/* Component Three: Platform Stats - Total Expenses */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Total Expenses Logged
                  </span>
                  <p className="text-2xl font-black text-emerald-950 mt-1">
                    ₹{loading ? "..." : (data?.platformStats.totalPlatformExpenses || 0).toLocaleString()}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">
                    Platform Expenditure
                  </span>
                </div>
                <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-2xl flex items-center justify-center font-bold">
                  💳
                </div>
              </div>
            </div>

            {/* Main Analytics Grid: Component Two (Trip Status) & Component Three (Destination Analytics) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Component Two: Trip Status Analytics */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      📈 Trip Status Analytics
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Active itineraries vs completed historical trips
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {data?.tripAnalytics.totalTrips || 0} Total
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800">
                      Active / Planned Trips
                    </span>
                    <p className="text-4xl font-black text-emerald-950">
                      {data?.tripAnalytics.activeTrips || 0}
                    </p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                      Ongoing & Upcoming
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50 border border-slate-200 text-center space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-wider text-sky-800">
                      Completed Trips
                    </span>
                    <p className="text-4xl font-black text-sky-950">
                      {data?.tripAnalytics.completedTrips || 0}
                    </p>
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
                        ? Math.round(
                            ((data.tripAnalytics.activeTrips || 0) /
                              data.tripAnalytics.totalTrips) *
                              100
                          )
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
                            ? ((data.tripAnalytics.activeTrips || 0) /
                                data.tripAnalytics.totalTrips) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                    <div
                      className="h-full bg-sky-500 rounded-r-full transition-all duration-500"
                      style={{
                        width: `${
                          data?.tripAnalytics.totalTrips
                            ? ((data.tripAnalytics.completedTrips || 0) /
                                data.tripAnalytics.totalTrips) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Component Three: Destination Analytics */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      🌟 Destination Analytics
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Most popular destinations based on trip creation
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Loading destination analytics...
                  </div>
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

      {/* Modal 1: Total Registered Users Modal */}
      {usersModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setUsersModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  👥 Registered Platform Users
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete directory of all registered user accounts
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search by name, email or role..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="px-4 py-2 rounded-xl text-xs border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 w-full sm:w-64"
                />
                <button
                  onClick={() => setUsersModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingUsers ? (
                <div className="py-12 text-center text-sm font-semibold text-slate-400">
                  Loading registered users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                  {userSearch ? "No users matching search criteria." : "No registered users found."}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3.5 px-4">User ID</th>
                        <th className="py-3.5 px-4">Name</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-400">#{u.id}</td>
                          <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 text-xs font-black flex items-center justify-center uppercase">
                              {u.name.substring(0, 1)}
                            </span>
                            {u.name}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-semibold">{u.email}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                u.role.toUpperCase() === "ADMINISTRATOR"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-sky-100 text-sky-900 border-sky-300"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Showing {filteredUsers.length} of {usersList.length} total users</span>
              <button
                onClick={() => setUsersModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Total Trips Created Modal */}
      {tripsModalOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setTripsModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-5xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  ✈️ All Platform Trips
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Overview of every trip created across all travelers
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search by title, owner, destination or status..."
                  value={tripSearch}
                  onChange={(e) => setTripSearch(e.target.value)}
                  className="px-4 py-2 rounded-xl text-xs border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 w-full sm:w-72"
                />
                <button
                  onClick={() => setTripsModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingTrips ? (
                <div className="py-12 text-center text-sm font-semibold text-slate-400">
                  Loading platform trips...
                </div>
              ) : filteredTrips.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                  {tripSearch ? "No trips matching search criteria." : "No trips created yet."}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200">
                        <th className="py-3.5 px-4">Trip Title</th>
                        <th className="py-3.5 px-4">Creator / Owner</th>
                        <th className="py-3.5 px-4">Destination</th>
                        <th className="py-3.5 px-4">Dates</th>
                        <th className="py-3.5 px-4">Budget</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {filteredTrips.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            {t.title}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 font-semibold">
                            👤 {t.ownerName || "Unknown"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {t.destinationName ? (
                              <span>
                                📍 <strong className="text-slate-900">{t.destinationName}</strong>
                                {t.destinationCountry ? `, ${t.destinationCountry}` : ""}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Not set</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                            {t.startDate && t.endDate
                              ? `${t.startDate} to ${t.endDate}`
                              : t.startDate || "TBD"}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                            ₹{(t.budget || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                t.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                                  : t.status === "ACTIVE" || t.status === "PLANNED"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-slate-100 text-slate-800 border-slate-300"
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold text-slate-500">
              <span>Showing {filteredTrips.length} of {tripsList.length} total trips</span>
              <button
                onClick={() => setTripsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
