export type RiotLink = {
  name: string;
  tag: string;
};

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  riot: RiotLink | null;
};
