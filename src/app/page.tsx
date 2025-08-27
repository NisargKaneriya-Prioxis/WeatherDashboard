"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";

const api_key = "2d67321f21d17146cae9d7ffc39637bd";
const base_url = "https://api.openweathermap.org/data/2.5";

interface ForecastItem {
  date: string;
  temperature: number;
  condition: string;
  icon: string;
}

interface WeatherCity {
  city: string;
  temperature: number;
  condition: string;
  favorite: boolean;
  icon: string;
  forecast?: ForecastItem[];
}

export default function Home() {
  const [cities, setCities] = useState<WeatherCity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDarkMode(prefersDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const storedFavorites = localStorage.getItem("favoriteCities");
    if (storedFavorites) {
      const favCities: WeatherCity[] = JSON.parse(storedFavorites);
      setCities((prev) => {
        const merged = [...prev];
        favCities.forEach((fav) => {
          if (!merged.some((c) => c.city === fav.city)) {
            merged.push(fav);
          } else {
            merged.forEach((c) => {
              if (c.city === fav.city) c.favorite = true;
            });
          }
        });
        return merged;
      });
    }
  }, []);

  const fetchWeatherData = async (city: string) => {
    try {
      setLoading(true);
      const currentRes = await fetch(
        `${base_url}/weather?q=${city}&appid=${api_key}&units=metric`
      );
      if (!currentRes.ok) throw new Error("City not found");
      const currentData = await currentRes.json();

      const forecastRes = await fetch(
        `${base_url}/forecast?q=${city}&appid=${api_key}&units=metric`
      );
      const forecastData = await forecastRes.json();

      const dailyForecast: ForecastItem[] = [];
      const addedDates = new Set();
      const today = new Date().toLocaleDateString();

      forecastData.list.forEach((item: any) => {
        const date = new Date(item.dt_txt).toLocaleDateString();
        if (
          date !== today &&
          !addedDates.has(date) &&
          dailyForecast.length < 5
        ) {
          dailyForecast.push({
            date: item.dt_txt,
            temperature: Math.round(item.main.temp),
            condition: item.weather[0].main,
            icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
          });
          addedDates.add(date);
        }
      });

      const newCity: WeatherCity = {
        city: currentData.name,
        temperature: Math.round(currentData.main.temp),
        condition: currentData.weather[0].main,
        icon: `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`,
        favorite: false,
        forecast: dailyForecast,
      };

      setCities((prev) => {
        if (prev.some((c) => c.city === newCity.city)) return prev;
        return [...prev, newCity];
      });
      setSearchTerm("");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) fetchWeatherData(searchTerm.trim());
  };

  const toggleFavorite = (cityName: string) => {
    setCities((prev) => {
      const updatedCities = prev.map((city) =>
        city.city === cityName ? { ...city, favorite: !city.favorite } : city
      );
      const favoritesToSave = updatedCities.filter((c) => c.favorite);
      localStorage.setItem("favoriteCities", JSON.stringify(favoritesToSave));
      return updatedCities;
    });
  };

  const displayedCities = showFavoritesOnly
    ? cities.filter((city) => city.favorite)
    : cities;

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isDarkMode ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1
            className={`text-4xl font-extrabold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Weather Dashboard
          </h1>
          <p
            className={`mt-2 ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}
          >
            Search and track your favorite cities.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-5 items-center justify-between mb-10">
          <form
            onSubmit={handleSearch}
            className={`flex items-center w-full md:w-[55%] p-3 rounded-xl shadow-md transition ${
              isDarkMode ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a city..."
              className={`flex-1 px-4 py-2 rounded-lg bg-transparent outline-none text-sm ${
                isDarkMode
                  ? "text-gray-100 placeholder-gray-400"
                  : "text-gray-900 placeholder-gray-500"
              }`}
              disabled={loading}
            />
            <button
              type="submit"
              className="ml-3 px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
              disabled={loading}
            >
              {loading ? "Loading..." : "Search"}
            </button>
          </form>

          <div className="flex gap-3">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-5 py-2 rounded-lg shadow-md transition text-sm font-medium ${
                showFavoritesOnly
                  ? "bg-yellow-500 text-white"
                  : isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Favorites
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-4 py-2 rounded-lg shadow-md transition text-sm font-medium ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>

        {displayedCities.length === 0 ? (
          <p
            className={`text-center ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No cities added yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {displayedCities.map((city, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl p-5 shadow-lg transition border flex flex-col items-center text-center hover:scale-[1.02] ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-300"
                }`}
              >
                <button
                  onClick={() => toggleFavorite(city.city)}
                  className="absolute top-3 right-3 text-2xl transition-colors hover:text-yellow-400"
                >
                  <FaStar
                    className={`transition-colors ${
                      city.favorite
                        ? "text-yellow-400"
                        : isDarkMode
                        ? "text-gray-400"
                        : "text-gray-300"
                    } hover:text-yellow-400`}
                    size={24}
                  />
                </button>

                <h2
                  className={`text-lg font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {city.city} (Today)
                </h2>

                <div className="flex items-center justify-center gap-3 mt-3">
                  <Image
                    src={city.icon}
                    alt={city.condition}
                    width={50}
                    height={50}
                  />
                  <p className="text-2xl font-bold text-blue-500">
                    {city.temperature}°C
                  </p>
                </div>
                <p
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  } text-sm mt-1`}
                >
                  {city.condition}
                </p>

                {city.forecast && (
                  <div className="grid grid-cols-5 gap-2 mt-4 w-full">
                    {city.forecast.map((day, idx2) => (
                      <div
                        key={idx2}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition ${
                          isDarkMode ? "bg-gray-700" : "bg-gray-50"
                        }`}
                      >
                        <p
                          className={`text-xs font-medium ${
                            isDarkMode ? "text-gray-200" : "text-gray-700"
                          }`}
                        >
                          {idx2 === 0
                            ? "Tomorrow"
                            : new Date(day.date).toLocaleDateString(undefined, {
                                weekday: "short",
                              })}
                        </p>
                        <Image
                          src={day.icon}
                          alt={day.condition}
                          width={30}
                          height={30}
                        />
                        <p className="text-sm font-semibold text-blue-500">
                          {day.temperature}°C
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
