"use client";

import { MessageCircle, UserMinus, UserPlus } from "@/lib/icons";
import FriendIdentity from "./FriendIdentity";
import type { FriendEntry } from "./types";

type FriendListProps = {
  entries: FriendEntry[];
  busyId: number | null;
  onMessage: (entry: FriendEntry) => void;
  onRemove: (friendshipId: number) => void;
};

export default function FriendList({
  entries,
  busyId,
  onMessage,
  onRemove,
}: FriendListProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-300">
        Barátok ({entries.length})
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500 inline-flex items-center gap-2">
          <UserPlus className="size-4" aria-hidden />
          Még nincsenek barátaid. Keress rá egy játékosra, és jelöld be.
        </p>
      ) : (
        entries.map((entry) => (
          <div
            key={entry.friendship_id}
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
          >
            <FriendIdentity user={entry.user} />
            <button
              type="button"
              disabled={busyId === entry.friendship_id}
              onClick={() => onMessage(entry)}
              className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <MessageCircle className="size-4" aria-hidden />
              Üzenet
            </button>
            <button
              type="button"
              disabled={busyId === entry.friendship_id}
              onClick={() => onRemove(entry.friendship_id)}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <UserMinus className="size-4" aria-hidden />
              Eltávolítás
            </button>
          </div>
        ))
      )}
    </section>
  );
}
