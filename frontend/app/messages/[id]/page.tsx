"use client";

import { useParams } from "next/navigation";
import ConversationScreen from "./ConversationScreen";

export default function ConversationPage() {
  const params = useParams();
  const conversationId = Number(params.id);

  return (
    <ConversationScreen key={conversationId} conversationId={conversationId} />
  );
}
