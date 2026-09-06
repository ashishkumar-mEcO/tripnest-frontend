"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";

interface Trip {
  id: number;
  title: string;
  ownerId?: number;
  ownerName?: string;
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

interface TripMember {
  id: number;
  tripId: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: string; // MEMBER or GROUP_ADMIN
  status: string; // APPROVED, PENDING, REJECTED
  createdAt?: string;
}

const CATEGORY_COLOR_PALETTE = [
  "#2563eb", // Deep Royal Blue
  "#0d9488", // Ocean Teal
  "#d97706", // Golden Bronze
  "#16a34a", // Forest Green
  "#7c3aed", // Deep Purple
  "#0284c7", // Sky Blue
  "#b45309", // Warm Amber
  "#334155", // Dark Slate
];

const CATEGORY_COLOR_MAP: Record<string, string> = {
  Accommodation: "#2563eb",
  Hotel: "#2563eb",
  Food: "#d97706",
  Dining: "#d97706",
  Restaurant: "#d97706",
  Transportation: "#0d9488",
  Transport: "#0d9488",
  Flight: "#0d9488",
  Activities: "#16a34a",
  Sightseeing: "#16a34a",
  Entertainment: "#16a34a",
  Shopping: "#7c3aed",
  Miscellaneous: "#475569",
  Other: "#475569",
};

function getCategoryColor(category: string, index: number): string {
  const normalized = category.trim();
  if (CATEGORY_COLOR_MAP[normalized]) {
    return CATEGORY_COLOR_MAP[normalized];
  }
  return CATEGORY_COLOR_PALETTE[index % CATEGORY_COLOR_PALETTE.length];
}

function ExpensePieChart({ summaries, totalSpent }: { summaries: CategorySummary[]; totalSpent: number }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  if (!summaries || summaries.length === 0 || totalSpent <= 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-sky-50/50 rounded-2xl border border-sky-100 text-center">
        <span className="text-3xl mb-2">📊</span>
        <p className="text-xs text-slate-500 font-semibold">No category expenses logged yet.</p>
        <p className="text-[10px] text-slate-400 mt-1">Add expenses to generate the live pie chart breakdown.</p>
      </div>
    );
  }

  let cumulativeAngle = 0;
  const slices = summaries.map((cat, idx) => {
    const amount = cat.totalAmount;
    const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
    const angle = (percentage / 100) * 360;

    const startAngle = cumulativeAngle;
    const effectiveAngle = angle >= 360 ? 359.999 : angle;
    const endAngle = startAngle + effectiveAngle;
    cumulativeAngle += angle;

    const color = getCategoryColor(cat.category, idx);

    const a1 = (startAngle - 90) * (Math.PI / 180);
    const a2 = (endAngle - 90) * (Math.PI / 180);

    const cx = 100;
    const cy = 100;
    const rOuter = 80;
    const rInner = 48;

    const x1_out = cx + rOuter * Math.cos(a1);
    const y1_out = cy + rOuter * Math.sin(a1);
    const x2_out = cx + rOuter * Math.cos(a2);
    const y2_out = cy + rOuter * Math.sin(a2);

    const x1_in = cx + rInner * Math.cos(a2);
    const y1_in = cy + rInner * Math.sin(a2);
    const x2_in = cx + rInner * Math.cos(a1);
    const y2_in = cy + rInner * Math.sin(a1);

    const largeArcFlag = effectiveAngle > 180 ? 1 : 0;

    const pathData = `M ${x1_out} ${y1_out} A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2_out} ${y2_out} L ${x1_in} ${y1_in} A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x2_in} ${y2_in} Z`;

    return {
      category: cat.category,
      amount,
      percentage: Math.round(percentage),
      exactPct: percentage.toFixed(1),
      color,
      pathData,
    };
  });

  const activeSlice = activeCategory ? slices.find((s) => s.category === activeCategory) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      {/* SVG Donut Chart Container */}
      <div className="md:col-span-5 flex flex-col items-center justify-center relative">
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full transition-transform duration-300">
            {slices.map((slice) => {
              const isActive = activeCategory === slice.category;
              return (
                <path
                  key={slice.category}
                  d={slice.pathData}
                  fill={slice.color}
                  opacity={activeCategory && !isActive ? 0.4 : 1}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setActiveCategory(slice.category)}
                  onMouseLeave={() => setActiveCategory(null)}
                  style={{
                    transform: isActive ? "scale(1.04)" : "scale(1)",
                    transformOrigin: "100px 100px",
                  }}
                />
              );
            })}
          </svg>

          {/* Central Donut Overlay Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
            {activeSlice ? (
              <>
                <span className="text-[10px] uppercase font-extrabold text-slate-400">{activeSlice.category}</span>
                <span className="text-lg font-black text-sky-950">₹{activeSlice.amount.toLocaleString()}</span>
                <span className="text-[10px] font-extrabold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full mt-0.5">
                  {activeSlice.exactPct}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] uppercase font-extrabold text-slate-400">Total Spent</span>
                <span className="text-lg font-black text-sky-950">₹{totalSpent.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-slate-500">{slices.length} Categories</span>
              </>
            )}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-2 font-medium">Hover over chart segments or legend cards to highlight</p>
      </div>

      {/* Category Cards & Legend */}
      <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {slices.map((slice) => {
          const isActive = activeCategory === slice.category;
          return (
            <div
              key={slice.category}
              onMouseEnter={() => setActiveCategory(slice.category)}
              onMouseLeave={() => setActiveCategory(null)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                isActive
                  ? "bg-sky-50 border-sky-300 shadow-sm"
                  : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="text-xs font-bold text-slate-800">{slice.category}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {slice.exactPct}%
                </span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-base font-black text-sky-950">₹{slice.amount.toLocaleString()}</span>
              </div>

              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${slice.exactPct}%`, backgroundColor: slice.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
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
  
  // Members & Join Requests State
  const [members, setMembers] = useState<TripMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TripMember[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: 'itinerary' | 'expenses' | 'members'
  const [activeTab, setActiveTab] = useState<"itinerary" | "expenses" | "members">("itinerary");

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

  // Invite Form State & 2-Step Search Preview
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<string>("MEMBER");
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [searchedUser, setSearchedUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [searchUserLoading, setSearchUserLoading] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const savedEmail = localStorage.getItem("userEmail") || "";
    setCurrentUserEmail(savedEmail);

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
    // Fetch Members & Join Requests
    fetchMembers();
    fetchPendingRequests();
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

  const fetchMembers = () => {
    api.get(`/trips/${tripId}/members`)
      .then((res) => {
        if (Array.isArray(res.data)) setMembers(res.data);
      })
      .catch((err) => console.error("Error fetching members:", err));
  };

  const fetchPendingRequests = () => {
    api.get(`/trips/${tripId}/join-requests`)
      .then((res) => {
        if (Array.isArray(res.data)) setPendingRequests(res.data);
      })
      .catch((err) => console.error("Error fetching join requests:", err));
  };

  // Determine if current user is Group Admin or Trip Owner
  const userMember = members.find((m) => m.userEmail?.toLowerCase() === currentUserEmail.toLowerCase());
  const isOwner = trip?.ownerName && currentUserEmail.toLowerCase().includes(trip.ownerName.toLowerCase());
  const isGroupAdminOrOwner = isOwner || userMember?.role === "GROUP_ADMIN" || members.length === 0;

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
        setDayTitle("");
        setDayDescription("");
        fetchItineraries();
      })
      .catch((err) => {
        console.error("Failed to add itinerary day:", err);
        alert("Failed to add itinerary day.");
      });
  };

  const handleOpenAddActivity = (itinId: number) => {
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

  const handleOpenEditActivity = (act: Activity) => {
    setEditingActId(act.id);
    setSelectedItinId(act.id);
    setActName(act.activityName);
    setActType(act.activityType || "Sightseeing");
    setActStartTime(act.startTime || "10:00");
    setActEndTime(act.endTime || "12:00");
    setActLocation(act.location || "");
    setActDescription(act.description || "");
    setActReminder(act.reminder || false);
    setShowActModal(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      activityName: actName,
      activityType: actType,
      startTime: actStartTime,
      endTime: actEndTime,
      location: actLocation,
      description: actDescription,
      reminder: actReminder,
    };

    if (editingActId) {
      api.put(`/activities/${editingActId}`, payload)
        .then(() => {
          setShowActModal(false);
          if (selectedItinId) fetchActivitiesForDay(selectedItinId);
          fetchItineraries();
        })
        .catch((err) => {
          console.error("Failed to update activity:", err);
          alert("Failed to update activity.");
        });
    } else {
      if (!selectedItinId) return;
      api.post(`/itineraries/${selectedItinId}/activities`, payload)
        .then(() => {
          setShowActModal(false);
          fetchActivitiesForDay(selectedItinId);
        })
        .catch((err) => {
          console.error("Failed to create activity:", err);
          alert("Failed to create activity.");
        });
    }
  };

  const handleDeleteActivity = (actId: number, itinId: number) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    api.delete(`/activities/${actId}`)
      .then(() => {
        fetchActivitiesForDay(itinId);
      })
      .catch((err) => {
        console.error("Failed to delete activity:", err);
        alert("Failed to delete activity.");
      });
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      category: expCategory,
      amount: parseFloat(expAmount) || 0,
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
        console.error("Failed to save expense:", err);
        alert("Failed to save expense.");
      });
  };

  const handleDeleteExpense = (expenseId: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    api.delete(`/expenses/${expenseId}`)
      .then(() => {
        fetchExpenses();
        fetchCategorySummary();
        fetchBudgetData();
      })
      .catch((err) => {
        console.error("Failed to delete expense:", err);
        alert("Failed to delete expense.");
      });
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      totalBudget: parseFloat(bgTotal) || 0,
    };

    api.put(`/trips/${tripId}/budget`, payload)
      .then(() => {
        setShowBudgetModal(false);
        fetchBudgetData();
        fetchTripData();
      })
      .catch((err) => {
        console.error("Failed to update target budget:", err);
        alert("Failed to update target budget.");
      });
  };

  // Member Management Handlers: 2-Step Search & Confirm Invite Flow
  const handleSearchUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteSuccess(null);
    setInviteError(null);
    setSearchedUser(null);
    setSearchUserLoading(true);

    api.get(`/users/lookup?email=${encodeURIComponent(inviteEmail.trim())}`)
      .then((res) => {
        setSearchedUser(res.data);
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || `No registered traveler found with email '${inviteEmail}'.`;
        setInviteError(errorMsg);
      })
      .finally(() => setSearchUserLoading(false));
  };

  const handleConfirmAddMember = () => {
    if (!searchedUser) return;

    setInviteSuccess(null);
    setInviteError(null);
    setInviteLoading(true);

    api.post(`/trips/${tripId}/members`, {
      email: searchedUser.email,
      role: inviteRole,
    })
      .then(() => {
        setInviteSuccess(`Successfully invited ${searchedUser.name} (${searchedUser.email}) as a trip ${inviteRole === "GROUP_ADMIN" ? "Group Admin" : "Member"}! 🎉`);
        setInviteEmail("");
        setSearchedUser(null);
        fetchMembers();
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || "Failed to invite member.";
        setInviteError(errorMsg);
      })
      .finally(() => setInviteLoading(false));
  };

  const handleChangeRole = (memberId: number, currentRole: string, userName: string) => {
    const newRole = currentRole === "GROUP_ADMIN" ? "MEMBER" : "GROUP_ADMIN";
    if (!confirm(`Are you sure you want to change ${userName}'s role to ${newRole === "GROUP_ADMIN" ? "Group Admin" : "Member"}?`)) return;

    api.put(`/trips/${tripId}/members/${memberId}/role`, { role: newRole })
      .then(() => {
        fetchMembers();
      })
      .catch((err) => {
        console.error("Role update failed:", err);
        alert(err.response?.data?.error || "Failed to change role.");
      });
  };

  const handleRemoveMember = (memberId: number, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this trip?`)) return;

    api.delete(`/trips/${tripId}/members/${memberId}`)
      .then(() => {
        fetchMembers();
      })
      .catch((err) => {
        console.error("Member deletion failed:", err);
        alert(err.response?.data?.error || "Failed to remove member.");
      });
  };

  const handleProcessJoinRequest = (requestId: number, approve: boolean, userName: string) => {
    api.put(`/trips/${tripId}/join-requests/${requestId}`, { approve })
      .then(() => {
        alert(approve ? `Approved ${userName}'s request!` : `Rejected request.`);
        fetchPendingRequests();
        fetchMembers();
      })
      .catch((err) => {
        console.error("Join request processing failed:", err);
        alert("Failed to process join request.");
      });
  };

  const currentTotalBudget = budgetData?.totalBudget || trip?.budget || 0;
  const totalSpentCalculated = budgetData?.spentAmount || expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const remainingCalculated = currentTotalBudget - totalSpentCalculated;
  const spentPercentage = currentTotalBudget > 0 ? Math.min(100, Math.round((totalSpentCalculated / currentTotalBudget) * 100)) : 0;

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800 pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Navigation Back Link */}
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-xs font-bold text-sky-700 hover:text-sky-900 mb-6 transition"
        >
          ← Back to Travel History
        </Link>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-4 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {loading || !trip ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading trip details...</div>
        ) : (
          <div className="space-y-8">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                    {trip.status || "PLANNED"}
                  </span>
                  <span className="text-sky-200 text-xs font-semibold">
                    📍 {trip.destinationName || "Custom Location"}
                  </span>
                </div>

                <h1 className="text-3xl font-black">{trip.title}</h1>

                <div className="flex items-center gap-4 mt-3 text-xs text-sky-100">
                  <span>📅 {trip.startDate} to {trip.endDate}</span>
                  <span>•</span>
                  <span>👥 {members.length > 0 ? `${members.length} Members` : `${trip.numberOfTravellers} Traveller(s)`}</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-right min-w-[200px]">
                <span className="text-[10px] text-sky-200 uppercase font-bold tracking-wider block">Target Budget</span>
                <span className="text-2xl font-black text-amber-300 block">
                  ₹{currentTotalBudget.toLocaleString()}
                </span>
                {isGroupAdminOrOwner && (
                  <button
                    onClick={() => setShowBudgetModal(true)}
                    className="text-[10px] font-bold text-sky-200 hover:text-white underline mt-1 block ml-auto"
                  >
                    ✏️ Edit Budget
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-3 border-b border-sky-200 pb-2">
              <button
                onClick={() => setActiveTab("itinerary")}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                  activeTab === "itinerary"
                    ? "bg-sky-600 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-sky-100 border border-sky-100"
                }`}
              >
                🗺️ Day-by-Day Itinerary ({itineraries.length} Days)
              </button>

              <button
                onClick={() => setActiveTab("expenses")}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                  activeTab === "expenses"
                    ? "bg-sky-600 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-sky-100 border border-sky-100"
                }`}
              >
                💳 Expense Tracker & Budget (₹{totalSpentCalculated.toLocaleString()})
              </button>

              <button
                onClick={() => setActiveTab("members")}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
                  activeTab === "members"
                    ? "bg-sky-600 text-white shadow-md"
                    : "bg-white text-slate-600 hover:bg-sky-100 border border-sky-100"
                }`}
              >
                👥 Group Members ({members.length})
                {pendingRequests.length > 0 && isGroupAdminOrOwner && (
                  <span className="bg-amber-400 text-slate-900 text-[10px] px-2 py-0.5 rounded-full font-black">
                    {pendingRequests.length} Pending
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: ITINERARY PLANNER */}
            {activeTab === "itinerary" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-sky-950">Trip Itinerary & Daily Schedule</h2>

                  <button
                    onClick={() => {
                      setDayNumber(itineraries.length + 1);
                      setDayDate(trip.startDate || "");
                      setShowDayModal(true);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    ➕ Add Itinerary Day
                  </button>
                </div>

                {itineraries.length === 0 ? (
                  <div className="bg-white border border-sky-100 rounded-3xl p-12 text-center shadow-sm">
                    <span className="text-4xl">🗓️</span>
                    <h3 className="text-lg font-bold text-sky-900 mt-2">No Itinerary Days Planned Yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Start planning day-by-day activities, sightseeing spots, and travel schedules.
                    </p>
                    <button
                      onClick={() => setShowDayModal(true)}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm"
                    >
                      + Add Day 1
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {itineraries.map((itin) => {
                      const dayActivities = activitiesMap[itin.id] || [];
                      return (
                        <div
                          key={itin.id}
                          className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
                            <div>
                              <span className="bg-sky-100 text-sky-900 font-black text-xs px-3 py-1 rounded-full uppercase">
                                Day {itin.dayNumber} • {itin.itineraryDate}
                              </span>
                              <h3 className="text-lg font-black text-sky-950 mt-2">{itin.title}</h3>
                              {itin.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{itin.description}</p>
                              )}
                            </div>

                            <button
                              onClick={() => handleOpenAddActivity(itin.id)}
                              className="bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold text-xs px-3 py-1.5 rounded-xl border border-sky-200 transition flex items-center gap-1"
                            >
                              ➕ Add Activity
                            </button>
                          </div>

                          {/* Activities List for this Day */}
                          <div>
                            {dayActivities.length === 0 ? (
                              <p className="text-xs text-slate-400 italic py-2">
                                No activities scheduled for Day {itin.dayNumber} yet.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {dayActivities.map((act) => (
                                  <div
                                    key={act.id}
                                    className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 flex flex-col justify-between hover:bg-sky-50 transition"
                                  >
                                    <div>
                                      <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-sky-950 text-sm">{act.activityName}</h4>
                                        <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                          {act.activityType || "Sightseeing"}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold mt-1">
                                        <span>⏰ {act.startTime} - {act.endTime}</span>
                                        {act.location && <span>📍 {act.location}</span>}
                                      </div>

                                      {act.description && (
                                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                                          {act.description}
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-sky-100/60 text-xs">
                                      {act.reminder ? (
                                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                          🔔 Reminder On
                                        </span>
                                      ) : <span />}

                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleOpenEditActivity(act)}
                                          className="text-sky-700 hover:text-sky-900 font-bold"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteActivity(act.id, itin.id)}
                                          className="text-rose-600 hover:text-rose-800 font-bold"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: EXPENSE TRACKER */}
            {activeTab === "expenses" && (
              <div className="space-y-6">
                {/* Top Section: Overview & Budget Progress */}
                <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black text-sky-950">Expense & Financial Overview</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Track live spending across categories and maintain budget target.</p>
                    </div>

                    <button
                      onClick={() => setShowExpenseModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      ➕ Add New Expense
                    </button>
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

                {/* Category Breakdown Chart */}
                <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-black text-sky-950 flex items-center gap-2">
                        📊 Expense Pie Chart & Category Breakdown
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Visual representation of expense distribution across categories.</p>
                    </div>
                  </div>

                  <ExpensePieChart summaries={categorySummaries} totalSpent={totalSpentCalculated} />
                </div>

                {/* Logged Expenses List */}
                <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-lg font-black text-sky-950">Recent Logged Expenses</h3>

                  {expenses.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No expenses logged for this trip yet. Click "+ Add New Expense" to get started!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {expenses.map((exp) => (
                        <div key={exp.id} className="py-3 flex justify-between items-center text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{exp.description || exp.category}</span>
                              <span className="bg-sky-100 text-sky-900 font-bold text-[10px] px-2 py-0.5 rounded-full">
                                {exp.category}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{exp.expenseDate}</span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-black text-sky-950 text-sm">₹{exp.amount.toLocaleString()}</span>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="text-rose-600 hover:text-rose-800 font-bold"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: GROUP MEMBERS & COLLABORATION */}
            {activeTab === "members" && (
              <div className="space-y-6">
                {/* Pending Join Requests Banner for Group Admin / Owner */}
                {isGroupAdminOrOwner && pendingRequests.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-lg font-black text-amber-950 flex items-center gap-2">
                      🔔 Pending Join Requests ({pendingRequests.length})
                    </h3>
                    <p className="text-xs text-amber-800">Review travelers requesting to join your group trip.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {pendingRequests.map((req) => (
                        <div key={req.id} className="bg-white border border-amber-200 rounded-2xl p-4 flex justify-between items-center shadow-xs">
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">{req.userName}</span>
                            <span className="text-xs text-slate-500 block">{req.userEmail}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleProcessJoinRequest(req.id, true, req.userName)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleProcessJoinRequest(req.id, false, req.userName)}
                              className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs px-3 py-1.5 rounded-xl"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Invite Member Section (Group Admin / Owner Only) */}
                {isGroupAdminOrOwner ? (
                  <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-sky-950 flex items-center gap-2">
                        ✉️ Invite a New Member to this Trip
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">Search traveler by email, verify user profile, and send invitation.</p>
                    </div>

                    {inviteSuccess && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
                        <span>🎉</span>
                        <span>{inviteSuccess}</span>
                      </div>
                    )}

                    {inviteError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{inviteError}</span>
                      </div>
                    )}

                    {/* Step 1: Search Form */}
                    <form onSubmit={handleSearchUser} className="flex flex-col sm:flex-row gap-3 items-center">
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => {
                          setInviteEmail(e.target.value);
                          if (searchedUser) setSearchedUser(null);
                        }}
                        placeholder="Enter user's email address (e.g. aman@google.com)"
                        className="w-full sm:flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                      />

                      <button
                        type="submit"
                        disabled={searchUserLoading}
                        className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {searchUserLoading ? "Searching..." : "🔍 Search User"}
                      </button>
                    </form>

                    {/* Step 2: Traveler Preview & Invitation Confirmation Card */}
                    {searchedUser && (
                      <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] uppercase font-black tracking-wider text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">
                            Traveler Found
                          </span>
                          <button
                            onClick={() => setSearchedUser(null)}
                            className="text-slate-400 hover:text-slate-600 font-bold text-xs"
                          >
                            ✕ Cancel
                          </button>
                        </div>

                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-full bg-sky-600 text-white font-black text-xl flex items-center justify-center shadow-sm uppercase">
                            {searchedUser.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-sky-950 text-base">{searchedUser.name}</h4>
                            <p className="text-xs text-slate-500 font-medium">{searchedUser.email}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-sky-200/60">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <span className="text-xs font-bold text-slate-700">Assign Role:</span>
                            <select
                              value={inviteRole}
                              onChange={(e) => setInviteRole(e.target.value)}
                              className="bg-white border border-sky-200 rounded-xl px-3 py-1.5 text-xs font-bold text-sky-950 outline-none"
                            >
                              <option value="MEMBER">👤 Member</option>
                              <option value="GROUP_ADMIN">👑 Group Admin</option>
                            </select>
                          </div>

                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={handleConfirmAddMember}
                              disabled={inviteLoading}
                              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-1.5"
                            >
                              {inviteLoading ? "Sending..." : "✉️ Send Invitation & Add Member"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold p-4 rounded-2xl">
                    ℹ️ You are viewing this trip as a Member. Member invitations and role management are restricted to Group Admins and the Trip Owner.
                  </div>
                )}

                {/* Approved Members List Cards */}
                <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-sky-950 flex items-center gap-2">
                      👥 Approved Group Members ({members.length})
                    </h3>
                    <span className="text-xs text-slate-400">Visible to all trip collaborators</span>
                  </div>

                  {members.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4">No members listed yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {members.map((mem) => {
                        const isAdmin = mem.role === "GROUP_ADMIN";
                        return (
                          <div
                            key={mem.id}
                            className="bg-slate-50/70 border border-slate-200 rounded-2xl p-4 flex justify-between items-center hover:bg-slate-100/50 transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white shadow-xs ${
                                isAdmin ? "bg-amber-500" : "bg-sky-600"
                              }`}>
                                {mem.userName ? mem.userName.charAt(0).toUpperCase() : "U"}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sky-950 text-sm">{mem.userName}</span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                    isAdmin ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-sky-100 text-sky-800"
                                  }`}>
                                    {isAdmin ? "👑 Group Admin" : "👤 Member"}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-500 block">{mem.userEmail}</span>
                              </div>
                            </div>

                            {/* Action controls */}
                            {isGroupAdminOrOwner && mem.id !== 0 ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleChangeRole(mem.id, mem.role, mem.userName)}
                                  className="text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-white border border-slate-200 hover:bg-sky-50 px-2.5 py-1 rounded-lg transition"
                                  title="Change Role"
                                >
                                  {isAdmin ? "Demote" : "Promote"}
                                </button>

                                <button
                                  onClick={() => handleRemoveMember(mem.id, mem.userName)}
                                  className="text-rose-600 hover:text-rose-800 font-bold text-xs p-1"
                                  title="Remove Member"
                                >
                                  🗑️
                                </button>
                              </div>
                            ) : mem.userEmail?.toLowerCase() === currentUserEmail.toLowerCase() && mem.id !== 0 ? (
                              <button
                                onClick={() => handleRemoveMember(mem.id, "this trip")}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-rose-200 transition"
                              >
                                🚪 Leave Trip
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals for Day, Activity, Expense, Budget */}
      {showDayModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-sky-950">🗓️ Add Itinerary Day</h2>
            <form onSubmit={handleAddDay} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Day Number</label>
                  <input
                    type="number"
                    min="1"
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
                  placeholder="e.g. Day 1: Beach Walk & Dinner"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={dayDescription}
                  onChange={(e) => setDayDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="Brief description of the day's plan..."
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

      {showActModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-sky-950">
              {editingActId ? "✏️ Edit Activity" : "🎯 Add New Activity"}
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
                  <label className="block font-bold text-slate-700 mb-1">Type</label>
                  <select
                    value={actType}
                    onChange={(e) => setActType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  >
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Adventure & Sports">Adventure & Sports</option>
                    <option value="Travel / Transport">Travel / Transport</option>
                    <option value="Relaxation">Relaxation</option>
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
                    required
                    value={actStartTime}
                    onChange={(e) => setActStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
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
                  placeholder="Notes, booking details, or ticket info..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="actReminder"
                  checked={actReminder}
                  onChange={(e) => setActReminder(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="actReminder" className="font-bold text-slate-700 cursor-pointer">
                  🔔 Enable Reminder Notification
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
                  {editingActId ? "Save Changes" : "Save Activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-sky-950">💳 Add New Expense</h2>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                >
                  <option value="Hotel">Hotel & Lodging</option>
                  <option value="Food">Food & Dining</option>
                  <option value="Transportation">Transportation & Cab</option>
                  <option value="Activities">Activities & Tickets</option>
                  <option value="Shopping">Shopping & Gifts</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none font-bold text-sky-900"
                  placeholder="e.g. 4500"
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                <input
                  type="text"
                  required
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                  placeholder="e.g. Seafood Shack Dinner & Drinks"
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

      {showBudgetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-black text-sky-950">💰 Set Target Trip Budget</h2>

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
