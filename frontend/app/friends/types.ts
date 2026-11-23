export type FriendUser = {
  id: number;
  username: string;
  riot_name: string | null;
  riot_tag: string | null;
};

export type FriendEntry = {
  friendship_id: number;
  user: FriendUser;
  created_at: string | null;
};

export type FriendsPayload = {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
};

export function riotLabel(user: FriendUser): string | null {
  if (!user.riot_name || !user.riot_tag) return null;
  return `${user.riot_name}#${user.riot_tag}`;
}
