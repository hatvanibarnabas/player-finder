"use client";

import { useState } from "react";
import Link from "next/link";
import { getAuthToken, isLoggedIn } from "@/lib/auth";
import {
  BadgeIcon,
  ChevronUp,
  Pencil,
  Shield,
  Star,
  TraitIcon,
  XCircle,
} from "@/lib/icons";

interface Trait {
  label: string;
  avg: number;
  stars: number;
}

interface Badge {
  label: string;
  tier: string;
}

export interface Scorecard {
  trust_score: number;
  badge: Badge;
  rating_count: number;
  traits: Record<string, Trait>;
  user_rating: Record<string, number | string | null> | null;
}

interface PlayerScorecardProps {
  game: string;
  name: string;
  tag: string;
  scorecard: Scorecard;
  onUpdate: (scorecard: Scorecard) => void;
}

const TRAIT_KEYS = [
  "skill",
  "teamwork",
  "communication",
  "reliability",
  "attitude",
] as const;

const BADGE_COLORS: Record<string, string> = {
  gold: "from-yellow-500/30 to-amber-600/20 border-yellow-500/50 text-yellow-300",
  trusted:
    "from-emerald-500/30 to-green-600/20 border-emerald-500/50 text-emerald-300",
  average: "from-blue-500/30 to-cyan-600/20 border-blue-500/50 text-blue-300",
  mixed: "from-orange-500/30 to-amber-600/20 border-orange-500/50 text-orange-300",
  caution: "from-red-500/30 to-rose-600/20 border-red-500/50 text-red-300",
  none: "from-gray-600/30 to-gray-700/20 border-gray-500/50 text-gray-400",
};

const DEFAULT_RATING = {
  skill: 0,
  teamwork: 0,
  communication: 0,
  reliability: 0,
  attitude: 0,
  comment: "",
};

function StarRow({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          aria-label={`${star} csillag`}
          className={`transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} ${
            star <= value ? "text-yellow-400" : "text-gray-600"
          }`}
        >
          <Star
            className="size-4"
            fill={star <= value ? "currentColor" : "none"}
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}

function TrustRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-700"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="text-blue-500 transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score || "—"}</span>
        <span className="text-xs text-gray-400 uppercase tracking-wide">
          Bizalom
        </span>
      </div>
    </div>
  );
}

export default function PlayerScorecard({
  game,
  name,
  tag,
  scorecard,
  onUpdate,
}: PlayerScorecardProps) {
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => ({
    ...DEFAULT_RATING,
    ...(scorecard.user_rating ?? {}),
    comment: (scorecard.user_rating?.comment as string) ?? "",
  }));

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const badgeClass = BADGE_COLORS[scorecard.badge.tier] ?? BADGE_COLORS.none;
  const BadgeGlyph = BadgeIcon[scorecard.badge.tier] ?? BadgeIcon.none;

  const handleSubmit = async () => {
    const missing = TRAIT_KEYS.filter((key) => form[key] < 1);
    if (missing.length > 0) {
      setError("Minden mutatót csillagozz le 1–5-ig!");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError("Bejelentkezés szükséges az értékeléshez!");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`${apiBase}/scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          game,
          name,
          tag,
          skill: form.skill,
          teamwork: form.teamwork,
          communication: form.communication,
          reliability: form.reliability,
          attitude: form.attitude,
          comment: form.comment || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nem sikerült menteni az értékelést!");
        return;
      }

      onUpdate(data.scorecard);
      setExpanded(false);
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/40 px-6 py-4 border-b border-gray-700">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Shield className="size-5 text-blue-400" aria-hidden />
          PF Bizalmi Index
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          Közösségi értékelés — megbízhatóság, csapatmunka, mentalitás
        </p>
      </div>

      <div className="p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
        <TrustRing score={scorecard.trust_score} />

        <div className="flex-1 w-full space-y-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-gradient-to-r ${badgeClass}`}
          >
            <BadgeGlyph className="size-5" aria-hidden />
            <span className="font-semibold">{scorecard.badge.label}</span>
          </div>

          <p className="text-gray-400 text-sm">
            {scorecard.rating_count > 0
              ? `${scorecard.rating_count} játékos értékelte`
              : "Még senki nem értékelte — légy te az első!"}
          </p>

          <div className="space-y-3">
            {TRAIT_KEYS.map((key) => {
              const trait = scorecard.traits[key];
              if (!trait) return null;
              const Icon = TraitIcon[key];

              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 bg-gray-900/50 rounded-lg px-4 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {Icon && (
                      <Icon className="size-4 shrink-0 text-blue-400" aria-hidden />
                    )}
                    <span className="text-sm text-gray-300 truncate">
                      {trait.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {trait.avg > 0 && (
                      <span className="text-xs text-gray-500">
                        {trait.avg.toFixed(1)}
                      </span>
                    )}
                    <StarRow value={trait.stars} readonly />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        {isLoggedIn() ? (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full text-sm text-blue-400 hover:text-blue-300 transition py-2 inline-flex items-center justify-center gap-2"
            >
              {expanded ? (
                <>
                  <ChevronUp className="size-4" aria-hidden />
                  Értékelés bezárása
                </>
              ) : scorecard.user_rating ? (
                <>
                  <Pencil className="size-4" aria-hidden />
                  Saját értékelés módosítása
                </>
              ) : (
                <>
                  <Star className="size-4" aria-hidden />
                  Értékelés leadása
                </>
              )}
            </button>

            {expanded && (
              <div className="mt-4 space-y-4 border-t border-gray-700 pt-4">
                {TRAIT_KEYS.map((key) => {
                  const trait = scorecard.traits[key];
                  const Icon = TraitIcon[key];
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-4"
                    >
                      <span className="text-sm text-gray-300 inline-flex items-center gap-2">
                        {Icon && (
                          <Icon
                            className="size-4 text-blue-400"
                            aria-hidden
                          />
                        )}
                        {trait?.label}
                      </span>
                      <StarRow
                        value={form[key]}
                        onChange={(v) =>
                          setForm((prev) => ({ ...prev, [key]: v }))
                        }
                      />
                    </div>
                  );
                })}

                <textarea
                  value={form.comment}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, comment: e.target.value }))
                  }
                  placeholder="Opcionális megjegyzés (max. 280 karakter)..."
                  maxLength={280}
                  rows={2}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

                {error && (
                  <p className="text-red-400 text-sm inline-flex items-center gap-2">
                    <XCircle className="size-4 shrink-0" aria-hidden />
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition"
                >
                  {submitting ? "Mentés..." : "Értékelés mentése"}
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500 text-sm py-2">
            <Link href="/login" className="text-blue-400 hover:underline">
              Jelentkezz be
            </Link>
            , hogy értékelhess — fiókonként egy értékelés játékosonként.
          </p>
        )}
      </div>
    </div>
  );
}
