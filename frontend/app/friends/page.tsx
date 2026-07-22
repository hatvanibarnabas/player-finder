"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getAuthToken } from "@/lib/auth";
import {
  ArrowLeft,
  Check,
  MessageCircle,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from "@/lib/icons";
import { useRouter } from "next/navigation";

interface FriendUser {
  id: number;
  username: string;
  riot_name: string | null;
  riot_tag: string | null;
}

interface FriendEntry {
  friendship_id: number;
  user: FriendUser;
  created_at: string | null;
}

interface FriendsPayload {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
}

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function riotLabel(user: FriendUser): string | null {
  if (!user.riot_name || !user.riot_tag) return null;
  return `${user.riot_name}#${user.riot_tag}`;
}

export default function FriendsPage() {
  const router = useRouter();
  const [data, setData] = useState<FriendsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiBase}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Nem sikerült betölteni a barátokat.");
        return;
      }
      setData(json);
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openChat = async (userId: number, friendshipId: number) => {
    setBusyId(friendshipId);
    setError("");
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiBase}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Nem sikerült megnyitni a beszélgetést.");
        return;
      }
      router.push(`/messages/${json.conversation.id}`);
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setBusyId(null);
    }
  };

  const call = async (
    path: string,
    method: string,
    body: Record<string, unknown>,
    friendshipId: number,
  ) => {
    setBusyId(friendshipId);
    setError("");
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiBase}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Hiba történt!");
        return;
      }
      await load();
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <Link
          href="/dashboard"
          className="text-gray-400 hover:text-white transition w-fit inline-flex items-center gap-2"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Vissza a főoldalra
        </Link>

        <div>
          <h1 className="text-2xl font-bold inline-flex items-center gap-2">
            <Users className="size-7 text-blue-400" aria-hidden />
            Barátok
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Beérkező jelölések kezelése és barátlista.
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Betöltés...
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl inline-flex items-start gap-2">
            <XCircle className="size-5 shrink-0 mt-0.5" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        {data && !loading && (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-gray-300">
                Beérkező jelölések ({data.incoming.length})
              </h2>
              {data.incoming.length === 0 ? (
                <p className="text-sm text-gray-500">Nincs függő jelölés.</p>
              ) : (
                data.incoming.map((entry) => (
                  <div
                    key={entry.friendship_id}
                    className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{entry.user.username}</p>
                      {riotLabel(entry.user) && (
                        <p className="text-sm text-gray-400">
                          {riotLabel(entry.user)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={busyId === entry.friendship_id}
                      onClick={() =>
                        call(
                          "/friends/respond",
                          "POST",
                          {
                            friendship_id: entry.friendship_id,
                            action: "accept",
                          },
                          entry.friendship_id,
                        )
                      }
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <Check className="size-3.5" aria-hidden />
                      Elfogadás
                    </button>
                    <button
                      type="button"
                      disabled={busyId === entry.friendship_id}
                      onClick={() =>
                        call(
                          "/friends/respond",
                          "POST",
                          {
                            friendship_id: entry.friendship_id,
                            action: "reject",
                          },
                          entry.friendship_id,
                        )
                      }
                      className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      Elutasítás
                    </button>
                  </div>
                ))
              )}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-gray-300">
                Elküldött jelölések ({data.outgoing.length})
              </h2>
              {data.outgoing.length === 0 ? (
                <p className="text-sm text-gray-500">Nincs elküldött jelölés.</p>
              ) : (
                data.outgoing.map((entry) => (
                  <div
                    key={entry.friendship_id}
                    className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{entry.user.username}</p>
                      {riotLabel(entry.user) && (
                        <p className="text-sm text-gray-400">
                          {riotLabel(entry.user)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={busyId === entry.friendship_id}
                      onClick={() =>
                        call(
                          "/friends",
                          "DELETE",
                          { friendship_id: entry.friendship_id },
                          entry.friendship_id,
                        )
                      }
                      className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
                    >
                      Visszavonás
                    </button>
                  </div>
                ))
              )}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold text-gray-300">
                Barátok ({data.friends.length})
              </h2>
              {data.friends.length === 0 ? (
                <p className="text-sm text-gray-500 inline-flex items-center gap-2">
                  <UserPlus className="size-4" aria-hidden />
                  Még nincsenek barátaid. Keress rá egy játékosra, és jelöld be.
                </p>
              ) : (
                data.friends.map((entry) => (
                  <div
                    key={entry.friendship_id}
                    className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{entry.user.username}</p>
                      {riotLabel(entry.user) && (
                        <p className="text-sm text-gray-400">
                          {riotLabel(entry.user)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={busyId === entry.friendship_id}
                      onClick={() => openChat(entry.user.id, entry.friendship_id)}
                      className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <MessageCircle className="size-4" aria-hidden />
                      Üzenet
                    </button>
                    <button
                      type="button"
                      disabled={busyId === entry.friendship_id}
                      onClick={() =>
                        call(
                          "/friends",
                          "DELETE",
                          { friendship_id: entry.friendship_id },
                          entry.friendship_id,
                        )
                      }
                      className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      <UserMinus className="size-4" aria-hidden />
                      Eltávolítás
                    </button>
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
