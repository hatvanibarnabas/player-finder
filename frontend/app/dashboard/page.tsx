"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthToken } from "@/lib/auth";
import { Check, GameIcon, Gamepad2, Search, Users, XCircle } from "@/lib/icons";

const GAMES = [
  {
    id: "lol",
    name: "League of Legends",
    color: "from-yellow-900 to-yellow-600",
    border: "border-yellow-600",
    hover: "hover:border-yellow-400",
    tag: "lol",
  },
  {
    id: "teamfight-tactics",
    name: "Teamfight Tactics",
    color: "from-blue-900 to-blue-600",
    border: "border-blue-600",
    hover: "hover:border-blue-400",
    tag: "teamfight-tactics",
  },
];

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface MeUser {
  id: number;
  username: string;
  email: string;
  riot: { name: string; tag: string } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<MeUser | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [search, setSearch] = useState("IT 5upp0rt #EUNE");
  const [recentSearches, setRecentSearches] = useState<
    { game: string; query: string }[]
  >([]);
  const [riotInput, setRiotInput] = useState("");
  const [riotBusy, setRiotBusy] = useState(false);
  const [riotError, setRiotError] = useState("");
  const [riotMessage, setRiotMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUser({
            id: parsed.id,
            username: parsed.username,
            email: parsed.email,
            riot: parsed.riot ?? null,
          });
        } catch {
          localStorage.removeItem("user");
          setProfileError("A helyi felhasználói adat sérült, jelentkezz be újra.");
        }
      }

      const recent = localStorage.getItem("recentSearches");
      if (recent) {
        try {
          setRecentSearches(JSON.parse(recent));
        } catch {
          localStorage.removeItem("recentSearches");
        }
      }

      const token = getAuthToken();
      if (!token) return;

      try {
        const res = await fetch(`${apiBase}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setProfileError(
            data.error || "Nem sikerült betölteni a profiladatokat.",
          );
          return;
        }

        if (data.user) {
          setUser(data.user);
          localStorage.setItem("user", JSON.stringify(data.user));
          setProfileError("");
          if (data.user.riot) {
            setRiotInput(`${data.user.riot.name}#${data.user.riot.tag}`);
          }
        }
      } catch {
        setProfileError(
          "Nem sikerült csatlakozni a szerverhez. A helyi adatok jelennek meg.",
        );
      }
    };
    loadData();
  }, []);

  const handleSearch = () => {
    if (!selectedGame || !search.trim()) return;

    const parts = search.trim().split("#");
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      alert('Helytelen formátum! Használj "Név#TAG" formátumot. Pl: Faker#KR1');
      return;
    }

    const newEntry = { game: selectedGame, query: search.trim() };
    const updated = [
      newEntry,
      ...recentSearches.filter((r) => r.query !== search.trim()),
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));

    router.push(
      `/search?game=${encodeURIComponent(selectedGame)}&q=${encodeURIComponent(search.trim())}`,
    );
  };

  const linkRiot = async () => {
    setRiotBusy(true);
    setRiotError("");
    setRiotMessage("");
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiBase}/me/riot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ riot_id: riotInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRiotError(data.error || "Nem sikerült hozzákapcsolni.");
        return;
      }
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setRiotMessage(data.message || "Riot fiók hozzákapcsolva!");
      if (data.user?.riot) {
        setRiotInput(`${data.user.riot.name}#${data.user.riot.tag}`);
      }
    } catch {
      setRiotError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setRiotBusy(false);
    }
  };

  const unlinkRiot = async () => {
    setRiotBusy(true);
    setRiotError("");
    setRiotMessage("");
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiBase}/me/riot`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setRiotError(data.error || "Nem sikerült leválasztani.");
        return;
      }
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setRiotInput("");
      setRiotMessage(data.message || "Riot fiók leválasztva.");
    } catch {
      setRiotError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setRiotBusy(false);
    }
  };

  const getGameName = (id: string) =>
    GAMES.find((g) => g.id === id)?.name ?? id;

  const getGameIcon = (id: string) => GameIcon[id] ?? Gamepad2;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Üdv újra,{" "}
              <span className="text-blue-400">{user?.username ?? "Játékos"}</span>!
            </h1>
            <p className="text-gray-400 mt-2">
              Keress rá bármely játékos profiljára League of Legends vagy
              Teamfight Tactics játékokban.
            </p>
          </div>
          <Link
            href="/friends"
            className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-xl transition inline-flex items-center gap-2"
          >
            <Users className="size-4 text-blue-400" aria-hidden />
            Barátok
          </Link>
        </div>

        {profileError && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl inline-flex items-start gap-2">
            <XCircle className="size-5 shrink-0 mt-0.5" aria-hidden />
            <span>{profileError}</span>
          </div>
        )}

        <section className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-200">
              Riot fiók összekötése
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Csak összekötött fiókokat lehet bejelölni. Add meg a Riot ID-det
              (Név#TAG), hogy mások megtaláljanak.
            </p>
          </div>

          {user?.riot ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-emerald-400">
                Kapcsolva:{" "}
                <span className="font-semibold text-white">
                  {user.riot.name}#{user.riot.tag}
                </span>
              </p>
              <button
                type="button"
                disabled={riotBusy}
                onClick={unlinkRiot}
                className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Leválasztás
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Pl: Faker#KR1"
                value={riotInput}
                onChange={(e) => setRiotInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && linkRiot()}
                className="flex-1 bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                disabled={riotBusy || !riotInput.trim()}
                onClick={linkRiot}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Összekötés
              </button>
            </div>
          )}

          {riotError && (
            <p className="text-sm text-red-400 inline-flex items-start gap-1.5">
              <XCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
              {riotError}
            </p>
          )}
          {riotMessage && (
            <p className="text-sm text-emerald-400">{riotMessage}</p>
          )}
        </section>

        <div>
          <h2 className="text-lg font-semibold text-gray-300 mb-4">
            Válassz játékot:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAMES.map((game) => {
              const Icon = getGameIcon(game.id);
              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`
                  bg-gradient-to-br ${game.color} border-2 ${game.border} ${game.hover}
                  rounded-xl p-6 text-left transition-all duration-200
                  ${selectedGame === game.id ? "ring-2 ring-white scale-105" : "opacity-80 hover:opacity-100"}
                `}
                >
                  <Icon className="size-10 mb-3" aria-hidden />
                  <div className="font-bold text-lg">{game.name}</div>
                  {selectedGame === game.id && (
                    <div className="text-xs mt-2 text-white/70 flex items-center gap-1.5">
                      <Check className="size-3.5" aria-hidden />
                      Kiválasztva
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Search className="size-4" aria-hidden />
              Keresés
            </button>
          </div>
        </div>

        {recentSearches.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-300 mb-4">
              Legutóbbi keresések:
            </h2>
            <div className="flex flex-col gap-2">
              {recentSearches.map((item, index) => {
                const Icon = getGameIcon(item.game);
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedGame(item.game);
                      setSearch(item.query);
                      router.push(
                        `/search?game=${encodeURIComponent(item.game)}&q=${encodeURIComponent(item.query)}`,
                      );
                    }}
                    className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-3 rounded-xl text-left transition"
                  >
                    <Icon className="size-5 shrink-0 text-blue-400" aria-hidden />
                    <div>
                      <span className="text-white font-medium">
                        {item.query}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        — {getGameName(item.game)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
