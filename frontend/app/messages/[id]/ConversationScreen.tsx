"use client";

import Link from "next/link";
import { ArrowLeft, XCircle } from "@/lib/icons";
import MessageComposer from "./MessageComposer";
import MessageList from "./MessageList";
import { useConversation } from "./useConversation";

type ConversationScreenProps = {
  conversationId: number;
};

export default function ConversationScreen({
  conversationId,
}: ConversationScreenProps) {
  const chat = useConversation(conversationId);

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
          {chat.otherUser && (
            <h1 className="text-lg font-semibold ml-auto">
              {chat.otherUser.username}
            </h1>
          )}
        </div>

        {chat.error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl inline-flex items-start gap-2">
            <XCircle className="size-5 shrink-0 mt-0.5" aria-hidden />
            <span>{chat.error}</span>
          </div>
        )}

        <MessageList
          messages={chat.messages}
          loading={chat.loading}
          meId={chat.meId}
          bottomRef={chat.bottomRef}
        />

        <MessageComposer
          body={chat.body}
          sending={chat.sending}
          onBodyChange={chat.setBody}
          onSubmit={chat.send}
        />
      </div>
    </div>
  );
}
