"use client";

import { XCircle } from "@/lib/icons";
import { formatRiotId } from "@/lib/riot";
import type { RiotLink } from "@/types/user";

type RiotAccountSectionProps = {
  linkedRiot: RiotLink | null;
  input: string;
  busy: boolean;
  error: string;
  message: string;
  onInputChange: (value: string) => void;
  onLink: () => void;
  onUnlink: () => void;
};

export default function RiotAccountSection({
  linkedRiot,
  input,
  busy,
  error,
  message,
  onInputChange,
  onLink,
  onUnlink,
}: RiotAccountSectionProps) {
  return (
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

      {linkedRiot ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-emerald-400">
            Kapcsolva:{" "}
            <span className="font-semibold text-white">
              {formatRiotId(linkedRiot)}
            </span>
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={onUnlink}
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
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && onLink()}
            className="flex-1 bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            disabled={busy || !input.trim()}
            onClick={onLink}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Összekötés
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 inline-flex items-start gap-1.5">
          <XCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
          {error}
        </p>
      )}
      {message && <p className="text-sm text-emerald-400">{message}</p>}
    </section>
  );
}
