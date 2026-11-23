"use client";

import { useState } from "react";
import { parseRiotId } from "@/lib/riot";

const FORMAT_ERROR =
  'Helytelen formátum! Használj "Név#TAG" formátumot. Pl: Faker#KR1';

export function usePlayerSearch() {
  const [game, setGameState] = useState<string | null>(null);
  const [query, setQueryState] = useState("");
  const [error, setError] = useState("");

  const setGame = (nextGame: string) => {
    setGameState(nextGame);
    setError("");
  };

  const setQuery = (nextQuery: string) => {
    setQueryState(nextQuery);
    setError("");
  };

  const apply = (nextGame: string, nextQuery: string) => {
    setGameState(nextGame);
    setQueryState(nextQuery);
    setError("");
  };

  const submit = (): { game: string; query: string } | null => {
    const trimmed = query.trim();
    if (!game || !trimmed) return null;

    if (!parseRiotId(trimmed)) {
      setError(FORMAT_ERROR);
      return null;
    }

    setError("");
    return { game, query: trimmed };
  };

  return { game, setGame, query, setQuery, error, apply, submit };
}
