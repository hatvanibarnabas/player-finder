"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getAuthToken } from "@/lib/auth";
import { fetchMe } from "./me-api";

export function useCurrentUser() {
  const { setUser } = useAuth();
  const setUserRef = useRef(setUser);
  const [error, setError] = useState("");

  useEffect(() => {
    setUserRef.current = setUser;
  }, [setUser]);

  useEffect(() => {
    if (!getAuthToken()) return;

    let active = true;

    const load = async () => {
      const result = await fetchMe();
      if (!active) return;

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (result.data.user) {
        setUserRef.current(result.data.user);
        setError("");
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  return { error };
}
