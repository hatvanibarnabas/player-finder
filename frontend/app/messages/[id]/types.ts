export type ChatUser = {
  id: number;
  username: string;
};

export type ChatMessage = {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  created_at: string;
};
