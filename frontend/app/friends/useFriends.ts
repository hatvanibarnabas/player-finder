"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchFriends,
  openConversation,
  removeFriendship,
  respondToFriendRequest,
} from "./friends-api";
import type { FriendsPayload } from "./types";

export function useFriends() {
  const [data, setData] = useState<FriendsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const showResult = (result: Awaited<ReturnType<typeof fetchFriends>>) => {
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setData(result.data);
    setError("");
    setLoading(false);
  };

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    showResult(await fetchFriends());
  }, []);

  useEffect(() => {
    let active = true;

    const run = async () => {
      const result = await fetchFriends();
      if (!active) return;
      showResult(result);
    };

    void run();

    return () => {
      active = false;
    };
  }, []);

  const runChange = async (
    friendshipId: number,
    request: () => ReturnType<typeof removeFriendship>,
  ) => {
    setBusyId(friendshipId);
    setError("");

    try {
      const result = await request();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await reload();
    } finally {
      setBusyId(null);
    }
  };

  const accept = (friendshipId: number) => {
    void runChange(friendshipId, () =>
      respondToFriendRequest(friendshipId, "accept"),
    );
  };

  const reject = (friendshipId: number) => {
    void runChange(friendshipId, () =>
      respondToFriendRequest(friendshipId, "reject"),
    );
  };

  const remove = (friendshipId: number) => {
    void runChange(friendshipId, () => removeFriendship(friendshipId));
  };

  const openChat = async (userId: number, friendshipId: number) => {
    setBusyId(friendshipId);
    setError("");

    try {
      const result = await openConversation(userId);
      if (!result.ok) {
        setError(result.error);
        return null;
      }
      return result.data.conversation.id;
    } finally {
      setBusyId(null);
    }
  };

  return { data, loading, error, busyId, accept, reject, remove, openChat };
}
