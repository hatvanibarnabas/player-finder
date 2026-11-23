import { apiFetch } from "@/lib/api";
import type { FriendsPayload } from "./types";

const NETWORK_ERROR = "Nem sikerült csatlakozni a szerverhez!";

export function fetchFriends() {
  return apiFetch<FriendsPayload>("/friends", {
    fallbackError: "Nem sikerült betölteni a barátokat.",
    networkError: NETWORK_ERROR,
  });
}

export function respondToFriendRequest(
  friendshipId: number,
  action: "accept" | "reject",
) {
  return apiFetch<unknown>("/friends/respond", {
    method: "POST",
    body: { friendship_id: friendshipId, action },
    fallbackError: "Hiba történt!",
    networkError: NETWORK_ERROR,
  });
}

export function removeFriendship(friendshipId: number) {
  return apiFetch<unknown>("/friends", {
    method: "DELETE",
    body: { friendship_id: friendshipId },
    fallbackError: "Hiba történt!",
    networkError: NETWORK_ERROR,
  });
}

export function openConversation(userId: number) {
  return apiFetch<{ conversation: { id: number } }>("/conversations", {
    method: "POST",
    body: { user_id: userId },
    fallbackError: "Nem sikerült megnyitni a beszélgetést.",
    networkError: NETWORK_ERROR,
  });
}
