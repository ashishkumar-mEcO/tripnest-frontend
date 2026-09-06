"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

interface Trip {
  id: number;
  title: string;
  ownerId?: number;
  ownerName?: string;
  destinationId?: number;
  destinationName?: string;
  destinationCountry?: string;
  startDate: string;
  endDate: string;
  numberOfTravellers?: number;
  budget?: number;
  status?: string;
}

interface Destination {
  id: number;
  name: string;
  country: string;
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search for My Trips
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Public Trip Search & Join Request Flow
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [publicSearchQuery, setPublicSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Trip[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [joinSuccessMap, setJoinSuccessMap] = useState<Record<number, string>>({});
  const [joinErrorMap, setJoinErrorMap] = useState<Record<number, string>>({});

  // Modal State for Create / Edit
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDestId, setFormDestId] = useState<number>(1);
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formTravellers, setFormTravellers] = useState<number>(1);
  const [formBudget, setFormBudget] = useState<number | string>(0);
  const [formStatus, setFormStatus] = useState<string>("PLANNED");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchTrips();
    fetchDestinations();
  }, [router]);

  const fetchTrips = () => {
    setLoading(true);
    api.get("/trips/my-trips")
      .then((res) => {
        if (Array.isArray(res.data)) setTrips(res.data);
      })
      .catch((err) => {
        console.error("Error fetching trips:", err);
        setError("Failed to load travel history.");
      })
      .finally(() => setLoading(false));
  };

  const fetchDestinations = () => {
    api.get("/destinations")
      .then((res) => {
        if (Array.isArray(res.data)) setDestinations(res.data);
      })
      .catch((err) => console.error("Error loading destinations:", err));
  };

  const handleSearchPublicTrips = (query: string) => {
    setPublicSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    api.get(`/trips/search?title=${encodeURIComponent(query)}`)
      .then((res) => {
        if (Array.isArray(res.data)) setSearchResults(res.data);
      })
      .catch((err) => console.error("Public search failed:", err))
      .finally(() => setSearchLoading(false));
  };

  const handleRequestToJoin = (targetTripId: number) => {
    setJoinSuccessMap((prev) => ({ ...prev, [targetTripId]: "" }));
    setJoinErrorMap((prev) => ({ ...prev, [targetTripId]: "" }));

    api.post(`/trips/${targetTripId}/join-requests`)
      .then(() => {
        setJoinSuccessMap((prev) => ({ ...prev, [targetTripId]: "Join request sent! Pending admin approval. 📩" }));
      })
      .catch((err) => {
        const msg = err.response?.data?.error || err.response?.data?.message || "Failed to send join request.";
        setJoinErrorMap((prev) => ({ ...prev, [targetTripId]: msg }));
      });
  };

  const handleOpenCreateModal = () => {
    setEditingTripId(null);
    setFormTitle("");
    setFormDestId(destinations[0]?.id || 1);
    setFormStartDate("");
    setFormEndDate("");
    setFormTravellers(1);
    setFormBudget(0);
    setFormStatus("PLANNED");
    setShowModal(true);
  };

  const handleOpenEditModal = (trip: Trip) => {
    setEditingTripId(trip.id);
    setFormTitle(trip.title);
    setFormDestId(trip.destinationId || 1);
    setFormStartDate(trip.startDate);
    setFormEndDate(trip.endDate);
    setFormTravellers(trip.numberOfTravellers || 1);
    setFormBudget(trip.budget || 0);
    setFormStatus(trip.status || "PLANNED");
    setShowModal(true);
  };

  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      title: formTitle,
      destinationId: formDestId,
      startDate: formStartDate,
      endDate: formEndDate,
      numberOfTravellers: formTravellers,
      budget: typeof formBudget === "number" ? formBudget : parseFloat(formBudget) || 0,
      status: formStatus,
    };

    if (editingTripId) {
      api.put(`/trips/${editingTripId}`, payload)
        .then(() => {
          setShowModal(false);
          fetchTrips();
        })
        .catch((err) => {
          console.error("Update error:", err);
          setError("Failed to update trip.");
        });
    } else {
      api.post("/trips", payload)
        .then(() => {
          setShowModal(false);
          fetchTrips();
        })
        .catch((err) => {
          console.error("Create error:", err);
          setError("Failed to create trip.");
        });
    }
  };

  const handleDeleteTrip = (id: number) => {
    if (!confirm("Are you sure you want to delete this trip from your travel history?")) return;

    api.delete(`/trips/${id}`)
      .then(() => fetchTrips())
      .catch((err) => {
        console.error("Delete error:", err);
        setError("Failed to delete trip.");
      });
  };

  const filteredTrips = trips.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.destinationName && t.destinationName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800 pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-sky-950">Travel History & Group Trips</h1>
            <p className="text-slate-600 text-sm mt-1">
              Create trips, collaborate with group members, and discover public trips to join.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowSearchModal(true)}
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-2"
            >
              🔍 Search & Join Trips
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition flex items-center gap-2"
            >
              ➕ Create New Trip
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-4 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {/* Filter & Search Toolbar */}
        <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <input
            type="text"
            placeholder="Search my trips by title or destination..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-sky-900 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PLANNED">Planned</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Trips List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading travel history...</div>
        ) : filteredTrips.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-3xl p-12 text-center shadow-sm">
            <span className="text-4xl">✈️</span>
            <h3 className="text-lg font-bold text-sky-900 mt-2">No Trips Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {search || statusFilter !== "ALL"
                ? "No trips match your search filters."
                : "Your travel history is empty. Create a new trip or search public trips to join!"}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowSearchModal(true)}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm"
              >
                🔍 Search Trips to Join
              </button>
              <button
                onClick={handleOpenCreateModal}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm"
              >
                + Create First Trip
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-black text-sky-950">{trip.title}</h3>
                      <span className="text-xs font-bold text-sky-600">
                        📍 {trip.destinationName || "Custom Destination"}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${trip.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : trip.status === "CANCELLED"
                            ? "bg-rose-100 text-rose-800"
                            : trip.status === "UPCOMING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-sky-100 text-sky-800"
                        }`}
                    >
                      {trip.status || "PLANNED"}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block font-medium">Dates:</span>
                      <span className="font-bold text-slate-700">
                        {trip.startDate} to {trip.endDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Budget:</span>
                      <span className="font-bold text-emerald-700">
                        {trip.budget ? `₹${trip.budget.toLocaleString()}` : "Flexible"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditModal(trip)}
                      className="bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-sky-200 transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 transition"
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  <Link
                    href={`/trips/${trip.id}`}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"
                  >
                    Trip Details & Group →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Popup for Search & Request to Join Public Trips */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-sky-950 flex items-center gap-2">
                🔍 Find Public Trips & Request to Join
              </h2>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search trips by title or destination (e.g. Goa, Paris)..."
                value={publicSearchQuery}
                onChange={(e) => handleSearchPublicTrips(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              />
            </div>

            {searchLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Searching trips...</div>
            ) : searchResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {publicSearchQuery ? "No trips found matching your query." : "Type a trip title above to search available group trips."}
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {searchResults.map((t) => (
                  <div
                    key={t.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-sky-950 text-base">{t.title}</span>
                        <span className="bg-sky-100 text-sky-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          📍 {t.destinationName || "Destination"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex gap-3">
                        <span>👤 Owner: {t.ownerName || "Administrator"}</span>
                        <span>📅 {t.startDate} to {t.endDate}</span>
                      </div>

                      {joinSuccessMap[t.id] ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 mt-2">
                          ⏳ Join Request Sent (Pending Admin Approval)
                        </span>
                      ) : joinErrorMap[t.id]?.includes("pending") ? (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 mt-2">
                          ⏳ Join Request Already Pending Approval
                        </span>
                      ) : joinErrorMap[t.id] ? (
                        <span className="text-xs font-bold text-rose-600 block mt-2">
                          ⚠️ {joinErrorMap[t.id]}
                        </span>
                      ) : null}
                    </div>

                    {!joinSuccessMap[t.id] && !joinErrorMap[t.id]?.includes("pending") && (
                      <button
                        onClick={() => handleRequestToJoin(t.id)}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition shrink-0"
                      >
                        📩 Request to Join
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Popup for Create / Edit Trip */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-sky-950">
              {editingTripId ? "Edit Trip" : "Create New Trip"}
            </h2>

            <form onSubmit={handleSaveTrip} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Trip Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="e.g. Bali Summer Vacation"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination</label>
                <select
                  value={formDestId}
                  onChange={(e) => setFormDestId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}, {d.country}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Travellers</label>
                  <input
                    type="number"
                    min={1}
                    value={formTravellers}
                    onChange={(e) => setFormTravellers(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none font-bold text-emerald-700"
                    placeholder="e.g. 50000"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trip Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-sky-900 outline-none"
                >
                  <option value="PLANNED">🗓️ Planned</option>
                  <option value="UPCOMING">🟡 Upcoming</option>
                  <option value="ONGOING">✈️ Ongoing</option>
                  <option value="COMPLETED">✅ Completed</option>
                  <option value="CANCELLED">❌ Cancelled</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2 rounded-xl shadow-md"
                >
                  {editingTripId ? "Save Changes" : "Create Trip"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
