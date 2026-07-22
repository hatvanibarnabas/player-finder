"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { ArrowLeft, MessageCircle, XCircle } from "@/lib/icons";

interface ConversationUser {
  id: number;
  username: string;
  riot_name: string | null;
  riot_tag: string | null;
}

interface ConversationItem {
  id: number;
  updated_at: string;
  unread_count: number;
  other_user: ConversationUser;
  last_message: {
    body: string;
    created_at: string;
    sender_id: number;
  } | null;
}

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiBase}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Nem sikerült betölteni a beszélgetéseket.");
        return;
      }
      setConversations(json.conversations ?? []);
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
            <MessageCircle className="size-7 text-blue-400" aria-hidden />
            Üzenetek
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Barátokkal folytatott beszélgetések. Új chat indításához menj a
            Barátok oldalra.
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

        {!loading && !error && conversations.length === 0 && (
          <p className="text-sm text-gray-500">
            Még nincs beszélgetésed.{" "}
            <Link href="/friends" className="text-blue-400 hover:underline">
              Nyiss chatet egy baráttal
            </Link>
            .
          </p>
        )}

        <div className="flex flex-col gap-2">
          {conversations.map((c) => {
            const unread = c.unread_count > 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/messages/${c.id}`)}
                className={`bg-gray-800 hover:bg-gray-700 border rounded-xl px-4 py-3 text-left transition ${
                  unread ? "border-blue-500/60" : "border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p
                    className={`font-medium inline-flex items-center gap-2 ${
                      unread ? "text-white" : ""
                    }`}
                  >
                    {c.other_user.username}
                    {unread && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-[11px] font-semibold inline-flex items-center justify-center">
                        {c.unread_count > 99 ? "99+" : c.unread_count}
                      </span>
                    )}
                  </p>
                  {c.last_message && (
                    <span className="text-xs text-gray-500 shrink-0">
                      {new Date(c.last_message.created_at).toLocaleString(
                        "hu-HU",
                        {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm mt-1 truncate ${
                    unread ? "text-gray-200 font-medium" : "text-gray-400"
                  }`}
                >
                  {c.last_message?.body ?? "Nincs még üzenet"}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
