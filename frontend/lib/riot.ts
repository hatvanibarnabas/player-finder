import type { RiotLink } from "@/types/user";

export function parseRiotId(input: string): RiotLink | null {
  const parts = input.trim().split("#");
  if (parts.length !== 2) return null;

  const name = parts[0].trim();
  const tag = parts[1].trim();
  if (!name || !tag) return null;

  return { name, tag };
}

export function formatRiotId(riot: RiotLink): string {
  return `${riot.name}#${riot.tag}`;
}
