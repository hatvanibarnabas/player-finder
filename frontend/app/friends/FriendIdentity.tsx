import { riotLabel, type FriendUser } from "./types";

type FriendIdentityProps = {
  user: FriendUser;
};

export default function FriendIdentity({ user }: FriendIdentityProps) {
  const riot = riotLabel(user);

  return (
    <div className="min-w-0 flex-1">
      <p className="font-medium">{user.username}</p>
      {riot && <p className="text-sm text-gray-400">{riot}</p>}
    </div>
  );
}
