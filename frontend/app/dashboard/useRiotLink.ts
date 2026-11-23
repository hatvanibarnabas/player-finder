"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { AuthUser } from "@/types/user";
import { linkRiotAccount, unlinkRiotAccount } from "./me-api";

export function useRiotLink() {
  const { setUser } = useAuth();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const run = async (
    request: () => ReturnType<typeof linkRiotAccount>,
    fallbackMessage: string,
    onSuccess?: (nextUser: AuthUser) => void,
  ) => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await request();
      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.data.user) {
        setUser(result.data.user);
        onSuccess?.(result.data.user);
      }
      setMessage(result.data.message || fallbackMessage);
    } finally {
      setBusy(false);
    }
  };

  const link = () => {
    const riotId = input.trim();
    if (!riotId) return;

    void run(() => linkRiotAccount(riotId), "Riot fiók hozzákapcsolva!");
  };

  const unlink = () => {
    void run(unlinkRiotAccount, "Riot fiók leválasztva.", () => {
      setInput("");
    });
  };

  return { input, setInput, busy, error, message, link, unlink };
}
