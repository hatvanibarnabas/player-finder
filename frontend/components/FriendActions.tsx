"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthToken, isLoggedIn } from "@/lib/auth";
import {
  Check,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from "@/lib/icons";

type FriendshipStatus =
  | "none"
  | "self"
  | "friends"
  | "pending_sent"
  | "pending_received";

interface LinkedUser {
  id: number;
  username: string;
  riot_name?: string | null;
  riot_tag?: string | null;
}

interface FriendshipInfo {
  status: FriendshipStatus;
  friendship_id: number | null;
}

interface Props {
  linkedUser: LinkedUser | null;
  friendship: FriendshipInfo | null;
  onFriendshipChange: (friendship: FriendshipInfo | null) => void;
}

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function FriendActions({
  linkedUser,
  friendship,
  onFriendshipChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  if (!linkedUser) {
    return (
      <div className="bg-gray-800/60 border border-dashed border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-400">
        Ez a Riot fiók nincs összekötve PlayerFinder fiókkal — ezért nem
        jelölhető be. A játékosnak a dashboardon kell hozzákapcsolnia a Riot
        ID-jét.
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 flex flex-wrap items-center gap-2">
        <Users className="size-4 text-blue-400" aria-hidden />
        <span>
          Regisztrált játékos:{" "}
          <span className="text-white font-medium">{linkedUser.username}</span>
        </span>
        <Link href="/login" className="text-blue-400 hover:underline ml-auto">
          Jelentkezz be a bejelöléshez
        </Link>
      </div>
    );
  }

  const status = friendship?.status ?? "none";

  const callApi = async (
    path: string,
    method: string,
    body?: Record<string, unknown>,
  ) => {
    setBusy(true);
    setError("");
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiBase}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Hiba történt!");
        return null;
      }
      return data;
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez!");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const sendRequest = async () => {
    const data = await callApi("/friends/request", "POST", {
      user_id: linkedUser.id,
    });
    if (data?.friendship) {
      onFriendshipChange({
        status: "pending_sent",
        friendship_id: data.friendship.id,
      });
    }
  };

  const respond = async (action: "accept" | "reject") => {
    if (!friendship?.friendship_id) return;
    const data = await callApi("/friends/respond", "POST", {
      friendship_id: friendship.friendship_id,
      action,
    });
    if (!data) return;
    onFriendshipChange(
      action === "accept"
        ? { status: "friends", friendship_id: friendship.friendship_id }
        : { status: "none", friendship_id: null },
    );
  };

  const remove = async () => {
    if (!friendship?.friendship_id) return;
    const data = await callApi("/friends", "DELETE", {
      friendship_id: friendship.friendship_id,
    });
    if (data) {
      onFriendshipChange({ status: "none", friendship_id: null });
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <Users className="size-4 text-blue-400 shrink-0" aria-hidden />
        <span>
          PlayerFinder:{" "}
          <span className="text-white font-semibold">{linkedUser.username}</span>
        </span>
      </div>

      {status === "self" && (
        <p className="text-sm text-gray-400">Ez a te hozzákapcsolt Riot fiókod.</p>
      )}

      {status === "friends" && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
            <UserCheck className="size-4" aria-hidden />
            Barátok vagytok
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <UserMinus className="size-4" aria-hidden />
            Eltávolítás
          </button>
        </div>
      )}

      {status === "pending_sent" && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-yellow-400">Jelölés elküldve</span>
          <button
            type="button"
            disabled={busy}
            onClick={remove}
            className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
          >
            Visszavonás
          </button>
        </div>
      )}

      {status === "pending_received" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-300 mr-2">Jelölést kaptál tőle</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => respond("accept")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Check className="size-3.5" aria-hidden />
            Elfogadás
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => respond("reject")}
            className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            Elutasítás
          </button>
        </div>
      )}

      {status === "none" && (
        <button
          type="button"
          disabled={busy}
          onClick={sendRequest}
          className="w-fit bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
        >
          <UserPlus className="size-4" aria-hidden />
          Bejelölés
        </button>
      )}

      {error && (
        <p className="text-sm text-red-400 inline-flex items-start gap-1.5">
          <XCircle className="size-4 shrink-0 mt-0.5" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
