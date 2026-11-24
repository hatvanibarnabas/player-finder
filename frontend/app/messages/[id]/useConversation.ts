"use client";

import { FormEvent, useEffect, useEffectEvent, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  fetchConversation,
  fetchMessages,
  sendChatMessage,
} from "./conversation-api";
import type { ChatMessage, ChatUser } from "./types";

const POLL_MS = 3000;

function isConversationId(id: number): boolean {
  return Number.isFinite(id) && id > 0;
}

export function useConversation(conversationId: number) {
  const { user } = useAuth();
  const valid = isConversationId(conversationId);
  const [otherUser, setOtherUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [requestError, setRequestError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const latestIdRef = useRef(0);

  const scrollToBottom = useEffectEvent(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  useEffect(() => {
    if (!valid) return;

    let active = true;

    const run = async () => {
      const [conversation, messageList] = await Promise.all([
        fetchConversation(conversationId),
        fetchMessages(conversationId),
      ]);
      if (!active) return;

      if (!conversation.ok) {
        setRequestError(conversation.error);
        setLoading(false);
        return;
      }
      if (!messageList.ok) {
        setRequestError(messageList.error);
        setLoading(false);
        return;
      }

      const list = messageList.data.messages ?? [];
      setOtherUser(conversation.data.conversation.other_user);
      setMessages(list);
      latestIdRef.current = list.at(-1)?.id ?? 0;
      setRequestError("");
      setLoading(false);
    };

    void run();

    return () => {
      active = false;
    };
  }, [conversationId, valid]);

  useEffect(() => {
    if (!loading) scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!valid) return;

    const tick = async () => {
      const after = latestIdRef.current;
      const result = await fetchMessages(
        conversationId,
        after > 0 ? after : undefined,
      );
      if (!result.ok) return;

      const incoming = result.data.messages ?? [];
      if (incoming.length === 0) return;

      setMessages((prev) => {
        const known = new Set(prev.map((message) => message.id));
        const fresh = incoming.filter((message) => !known.has(message.id));
        if (fresh.length === 0) return prev;

        const next = [...prev, ...fresh];
        latestIdRef.current = next.at(-1)?.id ?? latestIdRef.current;
        return next;
      });
    };

    const id = window.setInterval(tick, POLL_MS);
    return () => window.clearInterval(id);
  }, [conversationId, valid]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text || sending || !valid) return;

    setSending(true);
    setRequestError("");

    try {
      const result = await sendChatMessage(conversationId, text);
      if (!result.ok) {
        setRequestError(result.error);
        return;
      }
      if (!result.data.data) {
        setRequestError("Nem sikerült elküldeni.");
        return;
      }

      const message = result.data.data;
      setBody("");
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        latestIdRef.current = message.id;
        return [...prev, message];
      });
    } finally {
      setSending(false);
    }
  };

  return {
    otherUser,
    messages,
    meId: user?.id ?? null,
    body,
    setBody,
    loading: valid ? loading : false,
    sending,
    error: valid ? requestError : "Érvénytelen beszélgetés.",
    bottomRef,
    send,
  };
}
