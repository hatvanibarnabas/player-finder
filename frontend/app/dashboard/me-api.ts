import { apiFetch } from "@/lib/api";
import type { AuthUser } from "@/types/user";

type MeResponse = {
  user?: AuthUser;
};

type RiotMutationResponse = {
  message?: string;
  user?: AuthUser;
};

export function fetchMe() {
  return apiFetch<MeResponse>("/me", {
    fallbackError: "Nem sikerült betölteni a profiladatokat.",
    networkError:
      "Nem sikerült csatlakozni a szerverhez. A helyi adatok jelennek meg.",
  });
}

export function linkRiotAccount(riotId: string) {
  return apiFetch<RiotMutationResponse>("/me/riot", {
    method: "POST",
    body: { riot_id: riotId },
    fallbackError: "Nem sikerült hozzákapcsolni.",
  });
}

export function unlinkRiotAccount() {
  return apiFetch<RiotMutationResponse>("/me/riot", {
    method: "DELETE",
    fallbackError: "Nem sikerült leválasztani.",
  });
}
