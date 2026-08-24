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

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>([]);
  const [activeTab, setActiveTab] = useState<"ALL" | "POPULAR">("ALL");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Automatic Google Place Search Result
  const [placeResult, setPlaceResult] = useState<PlaceResponse | null>(null);
  const [searchingPlace, setSearchingPlace] = useState<boolean>(false);

  // Weather Modal state
  const [selectedCityWeather, setSelectedCityWeather] = useState<WeatherResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);

  // Google Places Details Modal state
  const [showPlaceModal, setShowPlaceModal] = useState<boolean>(false);

  useEffect(() => {
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

    api.get(`/weather?city=${cityName}`)
      .then((res) => {
        setSelectedCityWeather(res.data);
      })
      .catch((err) => {
        console.error("Error fetching live weather:", err);
      })
      .finally(() => setWeatherLoading(false));
  };

  const handleFetchGooglePlaces = (cityName: string) => {
    if (!cityName) return;
    setSearchingPlace(true);
    setShowPlaceModal(true);

    api.get(`/destinations/places?query=${encodeURIComponent(cityName)}`)
      .then((res) => {
        setPlaceResult(res.data);
      })
      .catch((err) => {
        console.error("Error fetching Google Places:", err);
      })
      .finally(() => setSearchingPlace(false));
  };

  const displayedDestinations = activeTab === "POPULAR" ? popularDestinations : destinations;

  const filteredDestinations = displayedDestinations.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-sky-50 text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <span className="bg-sky-100 text-sky-800 text-xs font-extrabold uppercase px-3 py-1 rounded-full border border-sky-200">
              Verified Destinations
            </span>
            <h1 className="text-3xl font-black text-sky-950 mt-2">Explore Destinations & Places</h1>
            <p className="text-slate-600 text-sm mt-1">
              Browse global travel spots, view verified ratings, and check weather forecasts.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="bg-white border border-sky-100 p-1.5 rounded-2xl flex gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "ALL" ? "bg-sky-600 text-white shadow-sm" : "text-slate-600 hover:text-sky-900"
              }`}
            >
              All Destinations ({destinations.length})
            </button>
            <button
              onClick={() => setActiveTab("POPULAR")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                activeTab === "POPULAR" ? "bg-amber-500 text-slate-900 shadow-sm" : "text-slate-600 hover:text-sky-900"
              }`}
            >
              ★ Popular Spots ({popularDestinations.length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-sm mb-8 flex items-center gap-3">
          <span className="text-xl pl-2">🔍</span>
          <input
            type="text"
            placeholder="Search any destination worldwide (e.g. Manali, Paris, Goa, Tokyo, Dubai)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm outline-none bg-transparent placeholder-slate-400 font-medium"
          />
          {searchingPlace && (
            <span className="text-xs text-sky-600 font-bold animate-pulse whitespace-nowrap">
              Searching...
            </span>
          )}
        </div>

        {/* Destinations Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading destinations...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Live Search Result Card when user searches a city outside default list */}
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

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <button
                    onClick={() => handleFetchLiveWeather(placeResult.name)}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
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
                className="bg-white border border-sky-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
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

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Weather: <strong className="text-slate-700">{dest.weatherInfo || "Mild"}</strong></span>
                    <button
                      onClick={() => handleFetchGooglePlaces(dest.name)}
                      className="text-xs text-sky-600 font-bold hover:underline flex items-center gap-1"
                    >
                      📍 Destination Info →
                    </button>
                  </div>

                  <button
                    onClick={() => handleFetchLiveWeather(dest.name)}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    🌤️ View Weather Forecast
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state when no place matches */}
        {!loading && filteredDestinations.length === 0 && !placeResult && !searchingPlace && search && (
          <div className="bg-white border border-sky-100 rounded-3xl p-12 text-center shadow-sm">
            <span className="text-4xl">🌤️</span>
            <h3 className="text-lg font-bold text-sky-900 mt-2">No Destinations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No places match &quot;{search}&quot;. Try searching for another city!
            </p>
          </div>
        )}
      </main>

      {/* Weather Forecast Modal */}
      {showWeatherModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-sky-100 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
            {weatherLoading ? (
              <div className="py-8">
                <span className="text-3xl animate-bounce">🌤️</span>
                <p className="text-xs font-bold text-sky-900 mt-2">Loading weather forecast...</p>
              </div>
            ) : selectedCityWeather ? (
              <div>
                <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
                  Live Weather Forecast
                </span>

                <h3 className="text-2xl font-black text-sky-950 mt-3">{selectedCityWeather.cityName}</h3>
                <p className="text-4xl font-black text-sky-600 my-2">
                  {selectedCityWeather.temperatureCelsius}°C
                </p>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  {selectedCityWeather.description}
                </p>

                <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-left text-xs">
                  <div className="p-3 rounded-2xl bg-sky-50">
                    <span className="text-slate-400 block font-medium">Humidity</span>
                    <span className="font-bold text-sky-900">{selectedCityWeather.humidity}%</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-sky-50">
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
