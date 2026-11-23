"use client";

import FriendIdentity from "./FriendIdentity";
import type { FriendEntry } from "./types";

type OutgoingRequestsProps = {
  entries: FriendEntry[];
  busyId: number | null;
  onCancel: (friendshipId: number) => void;
};

export default function OutgoingRequests({
  entries,
  busyId,
  onCancel,
}: OutgoingRequestsProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-300">
        Elküldött jelölések ({entries.length})
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">Nincs elküldött jelölés.</p>
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
              onClick={() => onCancel(entry.friendship_id)}
              className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
            >
              Visszavonás
            </button>
          </div>
        ))
      )}
    </section>
  );
}
