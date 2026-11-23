"use client";

import { useSyncExternalStore } from "react";
import {
  getServerRecentSearches,
  readRecentSearches,
  rememberRecentSearch,
  subscribeRecentSearches,
} from "@/lib/recent-searches";

export function useRecentSearches() {
  const items = useSyncExternalStore(
    subscribeRecentSearches,
    readRecentSearches,
    getServerRecentSearches,
  );

  const remember = (game: string, query: string) => {
    rememberRecentSearch({ game, query });
  };

  return { items, remember };
}
