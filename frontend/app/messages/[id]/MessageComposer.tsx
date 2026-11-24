"use client";

import type { FormEvent } from "react";
import { Send } from "@/lib/icons";

type MessageComposerProps = {
  body: string;
  sending: boolean;
  onBodyChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export default function MessageComposer({
  body,
  sending,
  onBodyChange,
  onSubmit,
}: MessageComposerProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="text"
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
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
  );
}
