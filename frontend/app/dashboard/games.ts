import type { LucideIcon } from "lucide-react";
import { GameIcon, Gamepad2 } from "@/lib/icons";

export type Game = {
  id: string;
  name: string;
  color: string;
  border: string;
  hover: string;
};

export const GAMES: Game[] = [
  {
    id: "lol",
    name: "League of Legends",
    color: "from-yellow-900 to-yellow-600",
    border: "border-yellow-600",
    hover: "hover:border-yellow-400",
  },
  {
    id: "teamfight-tactics",
    name: "Teamfight Tactics",
    color: "from-blue-900 to-blue-600",
    border: "border-blue-600",
    hover: "hover:border-blue-400",
  },
];

export function gameName(id: string): string {
  return GAMES.find((game) => game.id === id)?.name ?? id;
}

export function gameIcon(id: string): LucideIcon {
  return GameIcon[id] ?? Gamepad2;
}
