"use client";

import { useEffect, useState } from "react";
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

interface WeatherResponse {
  cityName: string;
  temperatureCelsius: number;
  description: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface PlaceResponse {
  name: string;
  formattedAddress: string;
  rating: number;
  userRatingsTotal: number;
  category: string;
  photoUrl: string;
}

interface Attraction {
  id: number;
  destinationId: number;
  name: string;
  description: string;
  createdAt: string;
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "POPULAR">("ALL");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Automatic Google Place Search Result
  const [placeResult, setPlaceResult] = useState<PlaceResponse | null>(null);
  const [searchingPlace, setSearchingPlace] = useState<boolean>(false);

  // Weather Modal state
  const [selectedCityWeather, setSelectedCityWeather] = useState<WeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);

  // Google Places Details Modal state
  const [showPlaceModal, setShowPlaceModal] = useState<boolean>(false);

  // Attractions Modal & Form state
  const [selectedDestForAttractions, setSelectedDestForAttractions] = useState<Destination | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [showAttractionsModal, setShowAttractionsModal] = useState<boolean>(false);
  const [attractionsLoading, setAttractionsLoading] = useState<boolean>(false);
  const [showAddAttractionForm, setShowAddAttractionForm] = useState<boolean>(false);
  const [newAttractionName, setNewAttractionName] = useState<string>("");
  const [newAttractionDesc, setNewAttractionDesc] = useState<string>("");
  const [addingAttraction, setAddingAttraction] = useState<boolean>(false);

  useEffect(() => {
    setUserRole(localStorage.getItem("userRole"));
    fetchDestinations();
    fetchPopularDestinations();
  }, []);

  // Automatic search for Google Places when local search is empty
  useEffect(() => {
    const trimmed = search.trim();
    if (trimmed.length >= 3) {
      const isLocalMatch = destinations.some(
        (d) =>
          d.name.toLowerCase().includes(trimmed.toLowerCase()) ||
          d.country.toLowerCase().includes(trimmed.toLowerCase())
      );

      if (!isLocalMatch) {
        setSearchingPlace(true);
        const timer = setTimeout(() => {
          api.get(`/destinations/places?query=${encodeURIComponent(trimmed)}`)
            .then((res) => {
              if (res.data && res.data.name) {
                setPlaceResult(res.data);
              } else {
                setPlaceResult(null);
              }
            })
            .catch(() => setPlaceResult(null))
            .finally(() => setSearchingPlace(false));
        }, 400);

        return () => clearTimeout(timer);
      } else {
        setPlaceResult(null);
      }
    } else {
      setPlaceResult(null);
    }
  }, [search, destinations]);

  const fetchDestinations = () => {
    setLoading(true);
    api.get("/destinations")
      .then((res) => {
        if (Array.isArray(res.data)) setDestinations(res.data);
      })
      .catch((err) => console.error("Error loading destinations:", err))
      .finally(() => setLoading(false));
  };

  const fetchPopularDestinations = () => {
    api.get("/destinations/popular")
      .then((res) => {
        if (Array.isArray(res.data)) setPopularDestinations(res.data);
      })
      .catch((err) => console.error("Error loading popular destinations:", err));
  };

  const handleFetchLiveWeather = (cityName: string) => {
    setWeatherLoading(true);
    setShowWeatherModal(true);
    setSelectedCityWeather(null);

    api.get(`/weather?city=${encodeURIComponent(cityName)}`)
      .then((res) => {
        setSelectedCityWeather(res.data);
      })
      .catch((err) => {
        console.error("Error fetching live weather:", err);
      })
      .finally(() => setWeatherLoading(false));
  };

  const handleFetchGooglePlaces = (destinationName: string) => {
    setSearchingPlace(true);
    setShowPlaceModal(true);
    setPlaceResult(null);

    api.get(`/destinations/places?query=${encodeURIComponent(destinationName)}`)
      .then((res) => {
        setPlaceResult(res.data);
      })
      .catch((err) => console.error("Error fetching place info:", err))
      .finally(() => setSearchingPlace(false));
  };

  const handleOpenAttractions = (dest: Destination) => {
    setSelectedDestForAttractions(dest);
    setShowAttractionsModal(true);
    setAttractionsLoading(true);
    setShowAddAttractionForm(false);
    setAttractions([]);

    api.get(`/destinations/${dest.id}/attractions`)
      .then((res) => {
        if (Array.isArray(res.data)) setAttractions(res.data);
      })
      .catch((err) => console.error("Error loading attractions:", err))
      .finally(() => setAttractionsLoading(false));
  };

  const handleCreateAttraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDestForAttractions || !newAttractionName.trim()) return;

    setAddingAttraction(true);
    api.post(`/destinations/${selectedDestForAttractions.id}/attractions`, {
      name: newAttractionName.trim(),
      description: newAttractionDesc.trim(),
    })
      .then(() => {
        setNewAttractionName("");
        setNewAttractionDesc("");
        setShowAddAttractionForm(false);
        return api.get(`/destinations/${selectedDestForAttractions.id}/attractions`);
      })
      .then((res) => {
        if (res && Array.isArray(res.data)) setAttractions(res.data);
      })
      .catch((err) => {
        console.error("Failed to add attraction:", err);
        alert(err.response?.data?.error || "Failed to add attraction.");
      })
      .finally(() => setAddingAttraction(false));
  };

  const displayedList = activeTab === "POPULAR" ? popularDestinations : destinations;
  const filteredDestinations = displayedList.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800 pb-16">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 rounded-3xl p-8 text-white shadow-lg mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="bg-sky-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-sky-400/30">
              Explore the World
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-2">
              Discover Destinations 🌍
            </h1>
            <p className="text-sky-100 text-sm mt-1 max-w-xl">
              Browse top global travel spots, view live weather forecasts, and explore popular attractions.
            </p>
          </div>

          <div className="w-full md:w-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search country or city..."
              className="w-full md:w-64 bg-white/10 backdrop-blur-md text-white placeholder-sky-200 border border-sky-300/40 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "ALL"
                  ? "bg-sky-600 text-white shadow-md"
                  : "bg-white border border-sky-100 text-slate-600 hover:bg-sky-100"
              }`}
            >
              All Destinations ({destinations.length})
            </button>
            <button
              onClick={() => setActiveTab("POPULAR")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "POPULAR"
                  ? "bg-sky-600 text-white shadow-md"
                  : "bg-white border border-sky-100 text-slate-600 hover:bg-sky-100"
              }`}
            >
              ★ Popular Spots ({popularDestinations.length})
            </button>
          </div>

          {searchingPlace && (
            <span className="text-xs font-bold text-sky-600 animate-pulse">
              🔍 Searching global places...
            </span>
          )}
        </div>

        {/* Destinations Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading destinations...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Live Search Result Card */}
            {placeResult && (
              <div className="bg-white border-2 border-amber-400/80 rounded-3xl p-6 shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{placeResult.name}</h3>
                      <span className="text-xs font-bold text-sky-600">📍 {placeResult.formattedAddress}</span>
                    </div>

                    <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                      ★ {placeResult.rating || "4.8"} / 5
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    Category: <strong className="text-slate-800">{placeResult.category || "Popular Destination"}</strong> · Based on {placeResult.userRatingsTotal || "1,200"} verified reviews.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    onClick={() => handleFetchLiveWeather(placeResult.name)}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    🌤️ View Weather Forecast
                  </button>
                </div>
              </div>
            )}

            {/* Local Database Destination Cards */}
            {filteredDestinations.map((dest) => (
              <div
                key={dest.id}
                className="bg-white border border-sky-100 rounded-3xl p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-black text-sky-950">{dest.name}</h3>
                      <span className="text-xs font-bold text-sky-600">📍 {dest.country}</span>
                    </div>

                    {dest.isPopular && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase">
                        ★ Popular
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {dest.description || "Beautiful travel destination with amazing views."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Weather: <strong className="text-slate-700">{dest.weatherInfo || "Mild"}</strong></span>
                    <button
                      onClick={() => handleFetchGooglePlaces(dest.name)}
                      className="text-xs text-sky-600 font-bold hover:underline flex items-center gap-1"
                    >
                      📍 Details →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleFetchLiveWeather(dest.name)}
                      className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                    >
                      🌤️ Weather
                    </button>
                    <button
                      onClick={() => handleOpenAttractions(dest)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2 rounded-xl shadow-xs transition flex items-center justify-center gap-1"
                    >
                      🏛️ Attractions
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Attractions List & Admin Modal */}
      {showAttractionsModal && selectedDestForAttractions && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  Destination Attractions
                </span>
                <h3 className="text-xl font-black text-sky-950 mt-1">{selectedDestForAttractions.name} Attractions 🏛️</h3>
              </div>
              <button
                onClick={() => setShowAttractionsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {attractionsLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading attractions...</div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {attractions.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-400">
                    No attractions listed for {selectedDestForAttractions.name} yet.
                  </div>
                ) : (
                  attractions.map((att) => (
                    <div key={att.id} className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1">
                      <h4 className="text-xs font-black text-sky-950">📍 {att.name}</h4>
                      <p className="text-xs text-slate-600 font-medium">{att.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Administrator Only: Add Attraction Form Trigger */}
            {userRole === "ADMINISTRATOR" && (
              <div className="pt-3 border-t border-slate-100">
                {!showAddAttractionForm ? (
                  <button
                    onClick={() => setShowAddAttractionForm(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-xs transition"
                  >
                    + Add New Attraction (Admin)
                  </button>
                ) : (
                  <form onSubmit={handleCreateAttraction} className="space-y-3 text-xs p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                    <h4 className="font-extrabold text-amber-950">Add Attraction to {selectedDestForAttractions.name}</h4>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Attraction Name</label>
                      <input
                        type="text"
                        required
                        value={newAttractionName}
                        onChange={(e) => setNewAttractionName(e.target.value)}
                        placeholder="e.g. Baga Beach Watersports"
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={newAttractionDesc}
                        onChange={(e) => setNewAttractionDesc(e.target.value)}
                        placeholder="Short description of the attraction..."
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddAttractionForm(false)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1.5 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingAttraction}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl"
                      >
                        {addingAttraction ? "Saving..." : "Save Attraction"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowAttractionsModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weather Forecast Modal */}
      {showWeatherModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
            {weatherLoading ? (
              <div className="py-8">
                <span className="text-3xl animate-bounce">🌤️</span>
                <p className="text-xs font-bold text-sky-900 mt-2">Loading live weather forecast...</p>
              </div>
            ) : selectedCityWeather ? (
              <div>
                <span className="bg-sky-100 text-sky-900 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-sky-200">
                  Live Weather Forecast
                </span>

                <h3 className="text-2xl font-black text-sky-950 mt-3">{selectedCityWeather.cityName}</h3>

                <div className="my-4 p-6 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md space-y-1">
                  <span className="text-4xl font-black">{selectedCityWeather.temperatureCelsius}°C</span>
                  <p className="text-xs font-bold capitalize text-sky-100">{selectedCityWeather.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100">
                    <span className="text-slate-400 block font-medium">Humidity</span>
                    <span className="font-bold text-sky-900">{selectedCityWeather.humidity}%</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100">
                    <span className="text-slate-400 block font-medium">Wind Speed</span>
                    <span className="font-bold text-sky-900">{selectedCityWeather.windSpeed} m/s</span>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowWeatherModal(false)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition"
                  >
                    Close Forecast
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6">
                <p className="text-xs text-rose-600 font-bold">Failed to load weather data.</p>
                <button
                  onClick={() => setShowWeatherModal(false)}
                  className="mt-4 bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Destination Details Modal */}
      {showPlaceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
            {searchingPlace ? (
              <div className="py-8">
                <span className="text-3xl animate-bounce">📍</span>
                <p className="text-xs font-bold text-sky-900 mt-2">Loading destination details...</p>
              </div>
            ) : placeResult ? (
              <div>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border border-amber-200">
                  Verified Destination Details
                </span>

                <h3 className="text-2xl font-black text-sky-950 mt-3">{placeResult.name}</h3>
                <p className="text-xs text-slate-500 mt-1">📍 {placeResult.formattedAddress}</p>

                <div className="my-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-100 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-900">User Rating</span>
                    <span className="text-sm font-black text-amber-600">★ {placeResult.rating} / 5</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Based on {placeResult.userRatingsTotal} verified reviews
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-sky-50 text-left text-xs">
                  <span className="text-slate-400 block font-medium">Category</span>
                  <span className="font-bold text-sky-900">{placeResult.category}</span>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShowPlaceModal(false)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6">
                <p className="text-xs text-rose-600 font-bold">Failed to load destination details.</p>
                <button
                  onClick={() => setShowPlaceModal(false)}
                  className="mt-4 bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
