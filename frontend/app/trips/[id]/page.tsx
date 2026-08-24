"use client";

import { useEffect, useState, use } from "react";
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

interface Itinerary {
  id: number;
  dayNumber: number;
  itineraryDate: string;
  title: string;
  description: string;
}

interface Activity {
  id: number;
  activityName: string;
  activityType: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
  reminder: boolean;
}

interface Expense {
  id: number;
  budgetId: number;
  tripId: number;
  category: string;
  amount: number;
  description: string;
  expenseDate: string;
}

interface CategorySummary {
  category: string;
  totalAmount: number;
}

interface BudgetData {
  id?: number;
  tripId: number;
  totalBudget: number;
  spentAmount: number;
  remainingBudget: number;
  currency?: string;
}

export default function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const tripId = resolvedParams.id;
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [activitiesMap, setActivitiesMap] = useState<Record<number, Activity[]>>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: 'itinerary' | 'expenses'
  const [activeTab, setActiveTab] = useState<"itinerary" | "expenses">("itinerary");

  // Add Day Modal State
  const [showDayModal, setShowDayModal] = useState<boolean>(false);
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [dayDate, setDayDate] = useState<string>("");
  const [dayTitle, setDayTitle] = useState<string>("");
  const [dayDescription, setDayDescription] = useState<string>("");

  // Activity Modal State
  const [showActModal, setShowActModal] = useState<boolean>(false);
  const [selectedItinId, setSelectedItinId] = useState<number | null>(null);
  const [editingActId, setEditingActId] = useState<number | null>(null);
  const [actName, setActName] = useState<string>("");
  const [actType, setActType] = useState<string>("Sightseeing");
  const [actStartTime, setActStartTime] = useState<string>("10:00");
  const [actEndTime, setActEndTime] = useState<string>("12:00");
  const [actLocation, setActLocation] = useState<string>("");
  const [actDescription, setActDescription] = useState<string>("");
  const [actReminder, setActReminder] = useState<boolean>(true);

  // Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expCategory, setExpCategory] = useState<string>("Transportation");
  const [expAmount, setExpAmount] = useState<string>("");
  const [expDate, setExpDate] = useState<string>("");
  const [expDescription, setExpDescription] = useState<string>("");

  // Budget Modal State
  const [showBudgetModal, setShowBudgetModal] = useState<boolean>(false);
  const [bgTotal, setBgTotal] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchTripData();
  }, [tripId, router]);

  const fetchTripData = () => {
    setLoading(true);
    // Fetch Trip details
    api.get(`/trips/${tripId}`)
      .then((res) => {
        setTrip(res.data);
      })
      .catch((err) => {
        console.error("Error fetching trip:", err);
        setError("Failed to load trip details.");
      });

    // Fetch Itineraries
    fetchItineraries();
    // Fetch Expenses & Budget
    fetchExpenses();
    fetchCategorySummary();
    fetchBudgetData();
  };

  const fetchItineraries = () => {
    api.get(`/trips/${tripId}/itineraries`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setItineraries(res.data);
          res.data.forEach((itin) => fetchActivitiesForDay(itin.id));
        }
      })
      .catch((err) => console.error("Error fetching itineraries:", err))
      .finally(() => setLoading(false));
  };

  const fetchActivitiesForDay = (itinId: number) => {
    api.get(`/itineraries/${itinId}/activities`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setActivitiesMap((prev) => ({ ...prev, [itinId]: res.data }));
        }
      })
      .catch((err) => console.error("Error fetching activities:", err));
  };

  const fetchExpenses = () => {
    api.get(`/trips/${tripId}/expenses`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setExpenses(res.data);
        }
      })
      .catch((err) => console.error("Error fetching expenses:", err));
  };

  const fetchCategorySummary = () => {
    api.get(`/trips/${tripId}/expenses/category-summary`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCategorySummaries(res.data);
        }
      })
      .catch((err) => console.error("Error fetching category summary:", err));
  };

  const fetchBudgetData = () => {
    api.get(`/trips/${tripId}/budget`)
      .then((res) => {
        if (res.data) {
          setBudgetData(res.data);
          setBgTotal(res.data.totalBudget?.toString() || "");
        }
      })
      .catch((err) => {
        console.log("No budget found yet:", err);
      });
  };

  const handleAddDay = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      dayNumber,
      itineraryDate: dayDate,
      title: dayTitle,
      description: dayDescription,
    };

    api.post(`/trips/${tripId}/itineraries`, payload)
      .then(() => {
        setShowDayModal(false);
        fetchItineraries();
      })
      .catch((err) => {
        console.error("Error adding day:", err);
        setError("Failed to add itinerary day.");
      });
  };

  const handleOpenAddActivityModal = (itinId: number) => {
    setSelectedItinId(itinId);
    setEditingActId(null);
    setActName("");
    setActType("Sightseeing");
    setActStartTime("10:00");
    setActEndTime("12:00");
    setActLocation("");
    setActDescription("");
    setActReminder(true);
    setShowActModal(true);
  };

  const handleOpenEditActivityModal = (itinId: number, act: Activity) => {
    setSelectedItinId(itinId);
    setEditingActId(act.id);
    setActName(act.activityName);
    setActType(act.activityType);
    setActStartTime(act.startTime ? act.startTime.substring(0, 5) : "10:00");
    setActEndTime(act.endTime ? act.endTime.substring(0, 5) : "12:00");
    setActLocation(act.location || "");
    setActDescription(act.description || "");
    setActReminder(act.reminder);
    setShowActModal(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItinId) return;

    const payload = {
      activityName: actName,
      activityType: actType,
      startTime: actStartTime.length === 5 ? `${actStartTime}:00` : actStartTime,
      endTime: actEndTime.length === 5 ? `${actEndTime}:00` : actEndTime,
      location: actLocation,
      description: actDescription,
      reminder: actReminder,
    };

    if (editingActId) {
      api.put(`/itineraries/${selectedItinId}/activities/${editingActId}`, payload)
        .then(() => {
          setShowActModal(false);
          fetchActivitiesForDay(selectedItinId);
        })
        .catch((err) => {
          console.error("Error updating activity:", err);
          setError("Failed to update activity.");
        });
    } else {
      api.post(`/itineraries/${selectedItinId}/activities`, payload)
        .then(() => {
          setShowActModal(false);
          fetchActivitiesForDay(selectedItinId);
        })
        .catch((err) => {
          console.error("Error adding activity:", err);
          setError("Failed to add activity.");
        });
    }
  };

  const handleDeleteActivity = (itinId: number, actId: number) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    api.delete(`/itineraries/${itinId}/activities/${actId}`)
      .then(() => fetchActivitiesForDay(itinId))
      .catch((err) => {
        console.error("Error deleting activity:", err);
        setError("Failed to delete activity.");
      });
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      category: expCategory,
      amount: parseFloat(expAmount),
      expenseDate: expDate || new Date().toISOString().split("T")[0],
      description: expDescription,
    };

    api.post(`/trips/${tripId}/expenses`, payload)
      .then(() => {
        setShowExpenseModal(false);
        setExpAmount("");
        setExpDescription("");
        fetchExpenses();
        fetchCategorySummary();
        fetchBudgetData();
      })
      .catch((err) => {
        console.error("Error adding expense:", err);
        setError("Failed to add expense.");
      });
  };

  const handleDeleteExpense = (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    api.delete(`/expenses/${id}`)
      .then(() => {
        fetchExpenses();
        fetchCategorySummary();
        fetchBudgetData();
      })
      .catch((err) => {
        console.error("Error deleting expense:", err);
        setError("Failed to delete expense.");
      });
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      totalBudget: parseFloat(bgTotal),
      spentAmount: budgetData?.spentAmount || 0,
    };

    const request = budgetData ? api.put(`/trips/${tripId}/budget`, payload) : api.post(`/trips/${tripId}/budget`, payload);

    request
      .then(() => {
        setShowBudgetModal(false);
        fetchBudgetData();
      })
      .catch((err) => {
        console.error("Error saving budget:", err);
        setError("Failed to save budget.");
      });
  };

  // Category Icon & Color Mapping
  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "Hotel":
        return { icon: "🏨", bg: "bg-indigo-100 text-indigo-800 border-indigo-200", bar: "bg-indigo-600" };
      case "Food":
        return { icon: "🍽️", bg: "bg-amber-100 text-amber-800 border-amber-200", bar: "bg-amber-500" };
      case "Transportation":
        return { icon: "🚕", bg: "bg-sky-100 text-sky-800 border-sky-200", bar: "bg-sky-500" };
      case "Shopping":
        return { icon: "🛍️", bg: "bg-emerald-100 text-emerald-800 border-emerald-200", bar: "bg-emerald-500" };
      case "Entertainment":
        return { icon: "🎟️", bg: "bg-purple-100 text-purple-800 border-purple-200", bar: "bg-purple-500" };
      default:
        return { icon: "📦", bg: "bg-slate-100 text-slate-800 border-slate-200", bar: "bg-slate-500" };
    }
  };

  const totalSpentCalculated = expenses.reduce((acc, item) => acc + (item.amount || 0), 0);
  const currentTotalBudget = budgetData?.totalBudget || trip?.budget || 0;
  const remainingCalculated = currentTotalBudget - totalSpentCalculated;
  const spentPercentage = currentTotalBudget > 0 ? Math.min(100, Math.round((totalSpentCalculated / currentTotalBudget) * 100)) : 0;

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800 pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-4">
          <Link href="/trips" className="text-xs font-bold text-sky-600 hover:underline">
            ← Back to Travel History
          </Link>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-4 rounded-xl flex justify-between items-center">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="font-bold underline">Dismiss</button>
          </div>
        )}

        {/* Trip Banner Header */}
        {trip && (
          <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-sky-800 rounded-3xl p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="bg-sky-500/40 text-amber-300 text-xs font-extrabold uppercase px-3 py-1 rounded-full border border-sky-400/30">
                Trip Details & Expense Tracker
              </span>
              <h1 className="text-3xl sm:text-4xl font-black mt-2">{trip.title}</h1>
              <p className="text-sky-100 text-xs mt-1">
                📍 {trip.destinationName || "Custom Destination"} · {trip.startDate} to {trip.endDate} · {trip.numberOfTravellers} Travellers
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setBgTotal(currentTotalBudget.toString());
                  setShowBudgetModal(true);
                }}
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-xl backdrop-blur-sm border border-white/30 transition flex items-center gap-2"
              >
                <span>💰 Target Budget: ₹{currentTotalBudget.toLocaleString()}</span>
                <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded font-black">EDIT</span>
              </button>

              <button
                onClick={() => {
                  setDayNumber(itineraries.length + 1);
                  setDayDate(trip.startDate || "");
                  setDayTitle(`Day ${itineraries.length + 1}: Sightseeing`);
                  setDayDescription("");
                  setShowDayModal(true);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition"
              >
                ➕ Add Day
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 mb-8 border-b border-sky-200 pb-3">
          <button
            onClick={() => setActiveTab("itinerary")}
            className={`font-black text-sm px-6 py-2.5 rounded-xl transition ${
              activeTab === "itinerary"
                ? "bg-sky-600 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-sky-100"
            }`}
          >
            🗓️ Day-by-Day Schedule ({itineraries.length} Days)
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`font-black text-sm px-6 py-2.5 rounded-xl transition flex items-center gap-2 ${
              activeTab === "expenses"
                ? "bg-sky-600 text-white shadow-md"
                : "bg-white text-slate-600 hover:bg-sky-100"
            }`}
          >
            <span>💳 Expense Tracker & Budget</span>
            <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full">
              ₹{totalSpentCalculated.toLocaleString()}
            </span>
          </button>
        </div>

        {/* TAB 1: ITINERARY DAYS */}
        {activeTab === "itinerary" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-sky-950 flex items-center gap-2">
              🗓️ Day-by-Day Itinerary Schedule
            </h2>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading day itineraries...</div>
            ) : itineraries.length === 0 ? (
              <div className="bg-white border border-sky-100 rounded-3xl p-12 text-center shadow-sm">
                <span className="text-4xl">🗓️</span>
                <h3 className="text-lg font-bold text-sky-900 mt-2">No Itinerary Days Added Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Click &quot;Add New Day&quot; to start organizing your travel schedule and activities!
                </p>
                <button
                  onClick={() => {
                    setDayNumber(1);
                    setDayDate(trip?.startDate || "");
                    setDayTitle("Day 1: Arrival & Exploration");
                    setDayDescription("");
                    setShowDayModal(true);
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm"
                >
                  + Add Day 1
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {itineraries.map((itin) => {
                  const activities = activitiesMap[itin.id] || [];
                  return (
                    <div key={itin.id} className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-sky-100 text-sky-900 font-black text-xs px-3 py-1 rounded-full">
                              DAY {itin.dayNumber}
                            </span>
                            <h3 className="text-lg font-bold text-sky-950">{itin.title || `Day ${itin.dayNumber}`}</h3>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            📅 {itin.itineraryDate} · {itin.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleOpenAddActivityModal(itin.id)}
                          className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition"
                        >
                          + Add Activity
                        </button>
                      </div>

                      {/* Activities List */}
                      <div className="mt-4 space-y-3">
                        {activities.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-400 bg-sky-50/40 rounded-2xl border border-dashed border-sky-200">
                            No activities added for Day {itin.dayNumber} yet. Click &quot;+ Add Activity&quot; above!
                          </div>
                        ) : (
                          activities.map((act) => (
                            <div
                              key={act.id}
                              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                    {act.activityType}
                                  </span>
                                  <h4 className="text-sm font-bold text-sky-900">{act.activityName}</h4>
                                </div>
                                <p className="text-xs text-slate-600">
                                  ⏰ {act.startTime ? act.startTime.substring(0, 5) : "TBD"} - {act.endTime ? act.endTime.substring(0, 5) : "TBD"} · 📍 {act.location || "Location TBD"}
                                </p>
                                {act.description && (
                                  <p className="text-xs text-slate-500 italic">&quot;{act.description}&quot;</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenEditActivityModal(itin.id, act)}
                                  className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(itin.id, act.id)}
                                  className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EXPENSE TRACKER & BUDGET */}
        {activeTab === "expenses" && (
          <div className="space-y-8">
            {/* 1. BUDGET SUMMARY CARDS & PROGRESS BAR */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-sky-950 flex items-center gap-2">
                    💰 Budget & Expense Overview
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Track your daily expenses and monitor your remaining trip balance in real-time.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setExpCategory("Transportation");
                      setExpAmount("");
                      setExpDate(new Date().toISOString().split("T")[0]);
                      setExpDescription("");
                      setShowExpenseModal(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition"
                  >
                    ➕ Add New Expense
                  </button>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-4">
                  <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block">Target Budget</span>
                  <span className="text-2xl font-black text-sky-900 mt-1 block">₹{currentTotalBudget.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Allocated for this trip</span>
                </div>

                <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Total Spent</span>
                  <span className="text-2xl font-black text-amber-900 mt-1 block">₹{totalSpentCalculated.toLocaleString()}</span>
                  <span className="text-[10px] text-amber-600 mt-1 block">{expenses.length} logged expense items</span>
                </div>

                <div className={`border rounded-2xl p-4 ${remainingCalculated >= 0 ? "bg-emerald-50/70 border-emerald-100" : "bg-rose-50/70 border-rose-100"}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider block ${remainingCalculated >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {remainingCalculated >= 0 ? "Remaining Budget" : "Over Budget"}
                  </span>
                  <span className={`text-2xl font-black mt-1 block ${remainingCalculated >= 0 ? "text-emerald-900" : "text-rose-900"}`}>
                    ₹{Math.abs(remainingCalculated).toLocaleString()}
                  </span>
                  <span className={`text-[10px] font-bold mt-1 block ${remainingCalculated >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {remainingCalculated >= 0 ? "Available to spend" : "⚠️ Exceeded target budget"}
                  </span>
                </div>
              </div>

              {/* Budget Progress Bar */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1.5">
                  <span>Budget Utilization ({spentPercentage}%)</span>
                  <span>₹{totalSpentCalculated.toLocaleString()} / ₹{currentTotalBudget.toLocaleString()}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${spentPercentage}%` }}
                    className={`h-full transition-all duration-500 ${
                      spentPercentage >= 100 ? "bg-rose-500" : spentPercentage >= 75 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 2. SPENDING BY CATEGORY BREAKDOWN CHART & CARDS */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-sky-950 flex items-center gap-2">
                📊 Spending Breakdown by Category
              </h3>

              {categorySummaries.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-sky-50/40 rounded-2xl border border-dashed border-sky-200">
                  No category spending data yet. Add expenses to see category chart!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categorySummaries.map((cat) => {
                    const theme = getCategoryTheme(cat.category);
                    const catPercentage = totalSpentCalculated > 0 ? Math.round((cat.totalAmount / totalSpentCalculated) * 100) : 0;

                    return (
                      <div key={cat.category} className="p-4 rounded-2xl border bg-slate-50/50 hover:bg-slate-50 transition space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${theme.bg}`}>
                            <span>{theme.icon}</span>
                            <span>{cat.category}</span>
                          </span>
                          <span className="text-xs font-extrabold text-slate-500">{catPercentage}%</span>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <span className="text-xl font-black text-slate-900">₹{cat.totalAmount.toLocaleString()}</span>
                        </div>

                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${catPercentage}%` }}
                            className={`h-full ${theme.bar}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. EXPENSES LIST TABLE */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-sky-950 flex items-center gap-2">
                  📜 Logged Expenses History
                </h3>
                <span className="text-xs font-bold text-slate-500">{expenses.length} Total Items</span>
              </div>

              {expenses.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 bg-sky-50/30 rounded-2xl border border-dashed border-sky-200">
                  No expenses logged for this trip yet. Click &quot;➕ Add New Expense&quot; above to log your first expense!
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((exp) => {
                    const theme = getCategoryTheme(exp.category);

                    return (
                      <div
                        key={exp.id}
                        className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className={`text-xl p-2.5 rounded-xl border ${theme.bg}`}>
                            {theme.icon}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${theme.bg}`}>
                                {exp.category}
                              </span>
                              <span className="text-xs text-slate-400">📅 {exp.expenseDate}</span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">{exp.description || `${exp.category} Expense`}</h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-center">
                          <span className="text-base font-black text-slate-900">
                            ₹{exp.amount.toLocaleString()}
                          </span>

                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold p-2 rounded-xl transition"
                            title="Delete Expense"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Add Day Modal */}
      {showDayModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-sky-950">Add Itinerary Day</h2>
            <form onSubmit={handleAddDay} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Day Number</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={dayNumber}
                    onChange={(e) => setDayNumber(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={dayDate}
                    onChange={(e) => setDayDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Day Title</label>
                <input
                  type="text"
                  required
                  value={dayTitle}
                  onChange={(e) => setDayTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="e.g. Day 1: Beach & Sunset Party"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={dayDescription}
                  onChange={(e) => setDayDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="Overview of the day..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDayModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2 rounded-xl shadow-md"
                >
                  Save Day
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Activity Modal */}
      {showActModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-sky-950">
              {editingActId ? "Edit Activity" : "Add Activity to Day"}
            </h2>

            <form onSubmit={handleSaveActivity} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Activity Name</label>
                <input
                  type="text"
                  required
                  value={actName}
                  onChange={(e) => setActName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="e.g. Scuba Diving at Grand Island"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Activity Type</label>
                  <select
                    value={actType}
                    onChange={(e) => setActType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Relaxation">Relaxation</option>
                    <option value="Travel">Travel / Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={actLocation}
                    onChange={(e) => setActLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    placeholder="e.g. Baga Beach"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={actStartTime}
                    onChange={(e) => setActStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={actEndTime}
                    onChange={(e) => setActEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={actDescription}
                  onChange={(e) => setActDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="Notes or instructions..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="reminder"
                  checked={actReminder}
                  onChange={(e) => setActReminder(e.target.checked)}
                  className="w-4 h-4 accent-sky-600 cursor-pointer"
                />
                <label htmlFor="reminder" className="font-bold text-slate-700 cursor-pointer">
                  Enable Activity Reminder
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowActModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2 rounded-xl shadow-md"
                >
                  {editingActId ? "Save Changes" : "Add Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-sky-950 flex items-center gap-2">
              ➕ Add New Trip Expense
            </h2>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none font-bold"
                >
                  <option value="Transportation">🚕 Transportation</option>
                  <option value="Hotel">🏨 Hotel / Stay</option>
                  <option value="Food">🍽️ Food & Dining</option>
                  <option value="Shopping">🛍️ Shopping</option>
                  <option value="Entertainment">🎟️ Entertainment / Tickets</option>
                  <option value="Miscellaneous">📦 Miscellaneous</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none font-bold text-emerald-700"
                    placeholder="e.g. 1500.00"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Receipt Note</label>
                <input
                  type="text"
                  required
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="e.g. Taxi from Airport to Hotel"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl shadow-md"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Target Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-sky-950 flex items-center gap-2">
              💰 Set Target Trip Budget
            </h2>

            <form onSubmit={handleSaveBudget} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Target Budget (₹)</label>
                <input
                  type="number"
                  step="100"
                  min="0"
                  required
                  value={bgTotal}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, "");
                    setBgTotal(val.replace(/^0+/, "") || "0");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none font-bold text-sky-900 text-base"
                  placeholder="e.g. 50000"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBudgetModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2 rounded-xl shadow-md"
                >
                  Save Target Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
