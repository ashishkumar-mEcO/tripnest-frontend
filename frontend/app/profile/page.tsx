"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function Profile() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  // Travel Preferences state
  const [travelStyle, setTravelStyle] = useState<string>("Adventure & Nature");
  const [preferredBudget, setPreferredBudget] = useState<string>("Moderate ($500 - $1500)");
  const [favoriteActivities, setFavoriteActivities] = useState<string>("Beaches, Sightseeing, Food Tours");

  // Account Settings toggles
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [tripReminders, setTripReminders] = useState<boolean>(true);
  const [marketingEmails, setMarketingEmails] = useState<boolean>(false);

  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const name = localStorage.getItem("userName") || "Traveler";
    const email = localStorage.getItem("userEmail") || "user@tripnest.com";
    setUserName(name);
    setUserEmail(email);
  }, [router]);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess("Travel preferences & account settings updated successfully!");
    setTimeout(() => setSavedSuccess(null), 4000);
  };

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-sky-950">User Profile & Account Settings</h1>
          <p className="text-slate-600 text-sm mt-1">
            Manage your personal profile, travel preferences, and notification settings.
          </p>
        </div>

        {savedSuccess && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold p-4 rounded-xl flex items-center gap-2">
            ✅ {savedSuccess}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: User Profile Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm text-center">
              <div className="w-24 h-24 bg-gradient-to-tr from-sky-600 to-amber-500 rounded-full mx-auto flex items-center justify-center text-4xl shadow-md text-white font-bold mb-4">
                {userName.charAt(0).toUpperCase()}
              </div>

              <h2 className="text-xl font-bold text-sky-950">{userName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{userEmail}</p>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-left text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Account Type:</span>
                  <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                    Traveler
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700">Active Member</span>
                </div>
              </div>
            </div>

            {/* Favorite Destinations Quick Card */}
            <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-sky-900 mb-3 flex items-center gap-2">
                💖 Favourite Destinations
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-900 font-semibold flex justify-between">
                  <span>📍 Goa, India</span>
                  <span className="text-amber-600">★ Beach</span>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-900 font-semibold flex justify-between">
                  <span>📍 Paris, France</span>
                  <span className="text-sky-600">★ City</span>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-900 font-semibold flex justify-between">
                  <span>📍 Kerala, India</span>
                  <span className="text-emerald-600">★ Nature</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right 2 Columns: Travel Preferences & Settings Form */}
          <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleSavePreferences} className="space-y-6">
              {/* Section 1: Travel Preferences */}
              <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-sky-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  🧳 Travel Preferences
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Travel Style
                    </label>
                    <select
                      value={travelStyle}
                      onChange={(e) => setTravelStyle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="Adventure & Nature">Adventure & Nature</option>
                      <option value="Beach & Relaxation">Beach & Relaxation</option>
                      <option value="Cultural & Historical">Cultural & Historical</option>
                      <option value="Luxury & Shopping">Luxury & Shopping</option>
                      <option value="Backpacking & Budget">Backpacking & Budget</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Budget Range
                    </label>
                    <select
                      value={preferredBudget}
                      onChange={(e) => setPreferredBudget(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    >
                      <option value="Budget (₹10,000 - ₹50,000)">Budget (₹10,000 - ₹50,000)</option>
                      <option value="Moderate (₹50,000 - ₹1,50,000)">Moderate (₹50,000 - ₹1,50,000)</option>
                      <option value="Luxury (₹1,50,000+)">Luxury (₹1,50,000+)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Favorite Activities
                    </label>
                    <input
                      type="text"
                      value={favoriteActivities}
                      onChange={(e) => setFavoriteActivities(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                      placeholder="e.g. Surfing, Museums, Trekking"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Account Settings & Notifications */}
              <div className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-sky-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                  ⚙️ Account Settings & Notifications
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-800">Email Notifications</p>
                      <p className="text-slate-500">Receive updates about your trip itineraries</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      className="w-4 h-4 accent-sky-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-800">Trip Reminders & Alerts</p>
                      <p className="text-slate-500">Get activity reminders before scheduled start times</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={tripReminders}
                      onChange={(e) => setTripReminders(e.target.checked)}
                      className="w-4 h-4 accent-sky-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
                    <div>
                      <p className="font-bold text-slate-800">Travel Recommendations</p>
                      <p className="text-slate-500">Receive weather alerts and popular destination deals</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={marketingEmails}
                      onChange={(e) => setMarketingEmails(e.target.checked)}
                      className="w-4 h-4 accent-sky-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition"
                  >
                    Save Preferences & Settings
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
