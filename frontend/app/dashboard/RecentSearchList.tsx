"use client";

import type { RecentSearch } from "@/lib/recent-searches";
import { gameIcon, gameName } from "./games";

type RecentSearchListProps = {
  items: RecentSearch[];
  onPick: (item: RecentSearch) => void;
};

export default function RecentSearchList({
  items,
  onPick,
}: RecentSearchListProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-300 mb-4">
        Legutóbbi keresések:
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const Icon = gameIcon(item.game);

          return (
            <button
              key={`${item.game}:${item.query}`}
              type="button"
              onClick={() => onPick(item)}
              className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-3 rounded-xl text-left transition"
            >
              <Icon className="size-5 shrink-0 text-blue-400" aria-hidden />
              <div>
                <span className="text-white font-medium">{item.query}</span>
                <span className="text-gray-400 text-sm ml-2">
                  — {gameName(item.game)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
