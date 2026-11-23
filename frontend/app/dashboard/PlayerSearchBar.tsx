"use client";

import { Search, XCircle } from "@/lib/icons";
import { gameName } from "./games";

type PlayerSearchBarProps = {
  gameId: string | null;
  query: string;
  error: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
};

export default function PlayerSearchBar({
  gameId,
  query,
  error,
  onQueryChange,
  onSubmit,
}: PlayerSearchBarProps) {
  const canSearch = Boolean(gameId) && query.trim().length > 0;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-300 mb-4">
        Keress játékosra:
      </h2>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder={
            gameId
              ? `Adj meg egy játékos nevet (${gameName(gameId)})...`
              : "Először válassz játékot!"
          }
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && onSubmit()}
          disabled={!gameId}
          className="flex-1 bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSearch}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          <Search className="size-4" aria-hidden />
          Keresés
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-400 mt-3 inline-flex items-start gap-1.5">
          <XCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
