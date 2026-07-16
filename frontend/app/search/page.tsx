"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PlayerScorecard, { type Scorecard } from "@/components/PlayerScorecard";
import { getAuthToken } from "@/lib/auth";

interface Rank {
  queue: string;
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
  winrate: string;
}

interface PlayerData {
  game: string;
  name: string;
  tag: string;
  level?: number;
  icon_id?: number;
  ranks: Rank[];
  note?: string;
  error?: string;
  scorecard?: Scorecard;
}

const TIER_COLORS: Record<string, string> = {
  IRON: "text-gray-400",
  BRONZE: "text-orange-700",
  SILVER: "text-gray-300",
  GOLD: "text-yellow-400",
  PLATINUM: "text-cyan-400",
  EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-400",
  MASTER: "text-purple-400",
  GRANDMASTER: "text-red-400",
  CHALLENGER: "text-yellow-300",
};

const GAME_NAMES: Record<string, string> = {
  lol: "League of Legends",
  "teamfight-tactics": "Teamfight Tactics",
};

const TIER_ICONS: Record<string, string> = {
  IRON: "🔩",
  BRONZE: "🥉",
  SILVER: "🥈",
  GOLD: "🥇",
  PLATINUM: "💎",
  EMERALD: "💚",
  DIAMOND: "💠",
  MASTER: "🔮",
  GRANDMASTER: "🏆",
  CHALLENGER: "👑",
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const game = searchParams.get("game") ?? "";
  const q =
    searchParams.get("q") ??
    (() => {
      const name = searchParams.get("name");
      const tag = searchParams.get("tag");
      return name && tag ? `${name}#${tag}` : "";
    })();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const fetchPlayer = async (game: string, name: string, tag: string) => {
    setLoading(true);
    setError("");
    setPlayer(null);

    try {
      const token = getAuthToken();
      const res = await fetch(
        `${apiBase}/search?game=${game}&name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Hiba történt a keresés során!");
        return;
      }

      setPlayer(data);
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!game || !q) return;

    const run = () => {
      const parts = q.split("#");
      if (parts.length !== 2) {
        setError(
          'Helytelen formátum! Használj "Név#TAG" formátumot. Pl: Faker#KR1',
        );
        return;
      }
      const [name, tag] = parts.map((part) => part.trim());
      fetchPlayer(game, name, tag);
    };

    run();
  }, [game, q]);

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        {/* Vissza gomb */}
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-white transition w-fit flex items-center gap-2"
        >
          ← Vissza a főoldalra
        </Link>

        {/* Keresési info */}
        <div>
          <h1 className="text-2xl font-bold">
            Keresés: <span className="text-blue-400">{q}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Játék: {GAME_NAMES[game] ?? game}
          </p>
        </div>

        {/* Töltés */}
        {loading && (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Játékos adatainak betöltése...
          </div>
        )}

        {/* Hiba */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl">
            ❌ {error}
          </div>
        )}

        {/* Játékos kártya */}
        {player && (
          <div className="flex flex-col gap-6">
            {/* Profil */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex items-center gap-6">
              {player.icon_id && (
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/${player.icon_id}.png`}
                  alt="Profil ikon"
                  className="w-20 h-20 rounded-full border-2 border-blue-500"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold">
                  {player.name}
                  <span className="text-gray-400 font-normal text-lg">
                    #{player.tag}
                  </span>
                </h2>
                <p className="text-gray-400">{player.game}</p>
                {player.level && (
                  <p className="text-blue-400 mt-1">⚡ {player.level}. szint</p>
                )}
              </div>
            </div>

            {player.scorecard && (
              <PlayerScorecard
                game={game}
                name={player.name}
                tag={player.tag}
                scorecard={player.scorecard}
                onUpdate={(scorecard) =>
                  setPlayer((prev) => (prev ? { ...prev, scorecard } : prev))
                }
              />
            )}

            {/* Rank kártyák */}

            {(player.ranks ?? []).length > 0 ? (
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-gray-300">
                  Ranglista:
                </h3>
                {player.ranks.map((rank, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">
                        {TIER_ICONS[rank.tier] ?? "🎮"}
                      </span>
                      <div>
                        <p className="text-gray-400 text-sm">{rank.queue}</p>
                        <p
                          className={`text-xl font-bold ${TIER_COLORS[rank.tier] ?? "text-white"}`}
                        >
                          {rank.tier} {rank.rank}
                        </p>
                        <p className="text-gray-400 text-sm">{rank.lp} LP</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-semibold">
                        {rank.wins}W
                      </p>
                      <p className="text-red-400 font-semibold">
                        {rank.losses}L
                      </p>
                      <p className="text-gray-300 text-sm">{rank.winrate} WR</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 text-gray-400">
                {player.note ?? "🎮 Nincs ranked adat ehhez a játékoshoz."}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
