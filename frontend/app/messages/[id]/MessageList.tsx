import type { RefObject } from "react";
import type { ChatMessage } from "./types";

type MessageListProps = {
  messages: ChatMessage[];
  loading: boolean;
  meId: number | null;
  bottomRef: RefObject<HTMLDivElement | null>;
};

function messageTime(value: string): string {
  return new Date(value).toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageList({
  messages,
  loading,
  meId,
  bottomRef,
}: MessageListProps) {
  return (
    <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl p-4 overflow-y-auto min-h-[50vh] max-h-[65vh] flex flex-col gap-3">
      {loading && <div className="text-gray-400 text-sm m-auto">Betöltés...</div>}

      {!loading && messages.length === 0 && (
        <p className="text-sm text-gray-500 m-auto">
          Még nincs üzenet. Írj először te!
        </p>
      )}

      {messages.map((message) => {
        const mine = meId !== null && message.sender_id === meId;

        return (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
              mine
                ? "bg-blue-600 self-end rounded-br-md"
                : "bg-gray-700 self-start rounded-bl-md"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.body}</p>
            <p
              className={`text-[10px] mt-1 ${
                mine ? "text-blue-100/70" : "text-gray-400"
              }`}
            >
              {messageTime(message.created_at)}
            </p>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
