"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { ArrowLeft, Send, XCircle } from "@/lib/icons";

interface ChatUser {
  id: number;
  username: string;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  created_at: string;
}

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getCurrentUserId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed.id === "number" ? parsed.id : Number(parsed.id) || null;
  } catch {
    return null;
  }
}

export default function ConversationPage() {
  const params = useParams();
  const conversationId = Number(params.id);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meId, setMeId] = useState<number | null>(null);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestIdRef = useRef(0);

  useEffect(() => {
    setMeId(getCurrentUserId());
  }, []);

  const scrollToBottom = useEffectEvent(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  const loadInitial = useCallback(async () => {
    if (!Number.isFinite(conversationId) || conversationId <= 0) {
      setError("Érvénytelen beszélgetés.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const [convRes, msgRes] = await Promise.all([
        fetch(`${apiBase}/conversations/${conversationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiBase}/conversations/${conversationId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const convJson = await convRes.json();
      const msgJson = await msgRes.json();

      if (!convRes.ok) {
        setError(convJson.error || "A beszélgetés nem található.");
        return;
      }
      if (!msgRes.ok) {
        setError(msgJson.error || "Nem sikerült betölteni az üzeneteket.");
        return;
      }

      setOtherUser(convJson.conversation.other_user);
      const list: Message[] = msgJson.messages ?? [];
      setMessages(list);
      latestIdRef.current = list.at(-1)?.id ?? 0;
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!Number.isFinite(conversationId) || conversationId <= 0) return;

    const tick = async () => {
      try {
        const token = getAuthToken();
        const after = latestIdRef.current;
        const url =
          after > 0
            ? `${apiBase}/conversations/${conversationId}/messages?after_id=${after}`
            : `${apiBase}/conversations/${conversationId}/messages`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        const incoming: Message[] = json.messages ?? [];
        if (incoming.length === 0) return;

        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const fresh = incoming.filter((m) => !known.has(m.id));
          if (fresh.length === 0) return prev;
          const next = [...prev, ...fresh];
          latestIdRef.current = next.at(-1)?.id ?? latestIdRef.current;
          return next;
        });
      } catch {
        // polling failure — next tick retries
      }
    };

    const id = window.setInterval(tick, 3000);
    return () => window.clearInterval(id);
  }, [conversationId]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      const token = getAuthToken();
      const res = await fetch(
        `${apiBase}/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body: text }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Nem sikerült elküldeni.");
        return;
      }

      const message: Message = json.data;
      setBody("");
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        const next = [...prev, message];
        latestIdRef.current = message.id;
        return next;
      });
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-6 flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-4 flex-1 min-h-[70vh]">
        <div className="flex items-center gap-3">
          <Link
            href="/messages"
            className="text-gray-400 hover:text-white transition inline-flex items-center gap-2"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Üzenetek
          </Link>
          {otherUser && (
            <h1 className="text-lg font-semibold ml-auto">{otherUser.username}</h1>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl inline-flex items-start gap-2">
            <XCircle className="size-5 shrink-0 mt-0.5" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl p-4 overflow-y-auto min-h-[50vh] max-h-[65vh] flex flex-col gap-3">
          {loading && (
            <div className="text-gray-400 text-sm m-auto">Betöltés...</div>
          )}

          {!loading && messages.length === 0 && (
            <p className="text-sm text-gray-500 m-auto">
              Még nincs üzenet. Írj először te!
            </p>
          )}

          {messages.map((msg) => {
            const mine = meId !== null && msg.sender_id === meId;
            return (
              <div
                key={msg.id}
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-blue-600 self-end rounded-br-md"
                    : "bg-gray-700 self-start rounded-bl-md"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    mine ? "text-blue-100/70" : "text-gray-400"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString("hu-HU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Írj üzenetet..."
            maxLength={2000}
            className="flex-1 bg-gray-800 border border-gray-600 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-xl disabled:opacity-50 inline-flex items-center gap-2"
          >
            <Send className="size-4" aria-hidden />
            Küldés
          </button>
        </form>
      </div>
    </div>
  );
}
