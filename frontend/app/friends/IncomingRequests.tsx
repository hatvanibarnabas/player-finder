"use client";

import { Check } from "@/lib/icons";
import FriendIdentity from "./FriendIdentity";
import type { FriendEntry } from "./types";

type IncomingRequestsProps = {
  entries: FriendEntry[];
  busyId: number | null;
  onAccept: (friendshipId: number) => void;
  onReject: (friendshipId: number) => void;
};

export default function IncomingRequests({
  entries,
  busyId,
  onAccept,
  onReject,
}: IncomingRequestsProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-gray-300">
        Beérkező jelölések ({entries.length})
      </h2>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">Nincs függő jelölés.</p>
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
              onClick={() => onAccept(entry.friendship_id)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Check className="size-3.5" aria-hidden />
              Elfogadás
            </button>
            <button
              type="button"
              disabled={busyId === entry.friendship_id}
              onClick={() => onReject(entry.friendship_id)}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              Elutasítás
            </button>
          </div>
        ))
      )}
    </section>
  );
}
