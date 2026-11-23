"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, XCircle } from "@/lib/icons";
import FriendList from "./FriendList";
import IncomingRequests from "./IncomingRequests";
import OutgoingRequests from "./OutgoingRequests";
import type { FriendEntry } from "./types";
import { useFriends } from "./useFriends";

export default function FriendsPage() {
  const router = useRouter();
  const friends = useFriends();

  const handleMessage = async (entry: FriendEntry) => {
    const conversationId = await friends.openChat(
      entry.user.id,
      entry.friendship_id,
    );
    if (conversationId === null) return;

    router.push(`/messages/${conversationId}`);
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

        {friends.loading && (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Betöltés...
          </div>
        )}

        {friends.error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl inline-flex items-start gap-2">
            <XCircle className="size-5 shrink-0 mt-0.5" aria-hidden />
            <span>{friends.error}</span>
          </div>
        )}

        {friends.data && !friends.loading && (
          <>
            <IncomingRequests
              entries={friends.data.incoming}
              busyId={friends.busyId}
              onAccept={friends.accept}
              onReject={friends.reject}
            />
            <OutgoingRequests
              entries={friends.data.outgoing}
              busyId={friends.busyId}
              onCancel={friends.remove}
            />
            <FriendList
              entries={friends.data.friends}
              busyId={friends.busyId}
              onMessage={handleMessage}
              onRemove={friends.remove}
            />
          </>
        )}
      </div>
    </div>
  );
}
