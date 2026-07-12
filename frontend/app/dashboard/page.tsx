"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const GAMES = [
  {
    id: "lol",
    name: "League of Legends",
    color: "from-yellow-900 to-yellow-600",
    border: "border-yellow-600",
    hover: "hover:border-yellow-400",
    emoji: "⚔️",
    tag: "lol",
  },
  {
    id: "teamfight-tactics",
    name: "Teamfight Tactics",
    color: "from-blue-900 to-blue-600",
    border: "border-blue-600",
    hover: "hover:border-blue-400",
    emoji: "🎲",
    tag: "teamfight-tactics",
  },
  {
    id: "valorant",
    name: "Valorant",
    color: "from-red-900 to-red-600",
    border: "border-red-600",
    hover: "hover:border-red-400",
    emoji: "🎯",
    tag: "valorant",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [search, setSearch] = useState("IT 5upp0rt #EUNE");
  const [recentSearches, setRecentSearches] = useState<
    { game: string; query: string }[]
  >([]);

  // ERRE:
  useEffect(() => {
    const loadData = () => {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));

      const recent = localStorage.getItem("recentSearches");
      if (recent) setRecentSearches(JSON.parse(recent));
    };
    loadData();
  }, []);

  const handleSearch = () => {
    if (!selectedGame || !search.trim()) return;

    const newEntry = { game: selectedGame, query: search.trim() };
    const updated = [
      newEntry,
      ...recentSearches.filter((r) => r.query !== search.trim()),
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    router.push(
      `/search?game=${selectedGame}&q=${encodeURIComponent(search.trim())}`,
    );
  };

  const getGameName = (id: string) =>
    GAMES.find((g) => g.id === id)?.name ?? id;
  const getGameEmoji = (id: string) =>
    GAMES.find((g) => g.id === id)?.emoji ?? "🎮";

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        {/* Üdvözlő szekció */}
        <div>
          <h1 className="text-3xl font-bold">
            Üdv újra,{" "}
            <span className="text-blue-400">{user?.username ?? "Játékos"}</span>
            ! 👋
          </h1>
          <p className="text-gray-400 mt-2">
            Keress rá bármely játékos profiljára League of Legends, Teamfight
            Tactics vagy Valorant játékokban.
          </p>
        </div>

        {/* Játék választó kártyák */}
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">
            Válassz játékot:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`
                  bg-gradient-to-br ${game.color} border-2 ${game.border} ${game.hover}
                  rounded-xl p-6 text-left transition-all duration-200
                  ${selectedGame === game.id ? "ring-2 ring-white scale-105" : "opacity-80 hover:opacity-100"}
                `}
              >
                <div className="text-4xl mb-3">{game.emoji}</div>
                <div className="font-bold text-lg">{game.name}</div>
                {selectedGame === game.id && (
                  <div className="text-xs mt-2 text-white/70">
                    ✔ Kiválasztva
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Keresősáv */}
        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">
            Keress játékosra:
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={
                selectedGame
                  ? `Adj meg egy játékos nevet (${getGameName(selectedGame)})...`
                  : "Először válassz játékot!"
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={!selectedGame}
              className="flex-1 bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSearch}
              disabled={!selectedGame || !search.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔍 Keresés
            </button>
          </div>
        </div>

        {/* Legutóbbi keresések */}
        {recentSearches.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">
              Legutóbbi keresések:
            </h2>
            <div className="flex flex-col gap-2">
              {recentSearches.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedGame(item.game);
                    setSearch(item.query);
                    router.push(
                      `/search?game=${item.game}&q=${encodeURIComponent(item.query)}`,
                    );
                  }}
                  className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-3 rounded-xl text-left transition"
                >
                  <span className="text-xl">{getGameEmoji(item.game)}</span>
                  <div>
                    <span className="text-white font-medium">{item.query}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      — {getGameName(item.game)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
