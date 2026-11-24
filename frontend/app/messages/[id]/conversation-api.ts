import { apiFetch } from "@/lib/api";
import type { ChatMessage, ChatUser } from "./types";

const NETWORK_ERROR = "Nem sikerült csatlakozni a szerverhez!";

export function fetchConversation(conversationId: number) {
  return apiFetch<{ conversation: { other_user: ChatUser } }>(
    `/conversations/${conversationId}`,
    {
      fallbackError: "A beszélgetés nem található.",
      networkError: NETWORK_ERROR,
    },
  );
}

export function fetchMessages(conversationId: number, afterId?: number) {
  const query = afterId && afterId > 0 ? `?after_id=${afterId}` : "";

  return apiFetch<{ messages?: ChatMessage[] }>(
    `/conversations/${conversationId}/messages${query}`,
    {
      fallbackError: "Nem sikerült betölteni az üzeneteket.",
      networkError: NETWORK_ERROR,
    },
  );
}

export function sendChatMessage(conversationId: number, body: string) {
  return apiFetch<{ data?: ChatMessage }>(
    `/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: { body },
      fallbackError: "Nem sikerült elküldeni.",
      networkError: NETWORK_ERROR,
    },
  );
}
