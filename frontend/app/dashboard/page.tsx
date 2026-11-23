"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Users, XCircle } from "@/lib/icons";
import type { RecentSearch } from "@/lib/recent-searches";
import GamePicker from "./GamePicker";
import PlayerSearchBar from "./PlayerSearchBar";
import RecentSearchList from "./RecentSearchList";
import RiotAccountSection from "./RiotAccountSection";
import { useCurrentUser } from "./useCurrentUser";
import { usePlayerSearch } from "./usePlayerSearch";
import { useRecentSearches } from "./useRecentSearches";
import { useRiotLink } from "./useRiotLink";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { error: profileError } = useCurrentUser();
  const riot = useRiotLink();
  const recent = useRecentSearches();
  const search = usePlayerSearch();

  const openSearch = (game: string, query: string) => {
    router.push(
      `/search?game=${encodeURIComponent(game)}&q=${encodeURIComponent(query)}`,
    );
  };

  const handleSearch = () => {
    const next = search.submit();
    if (!next) return;

    recent.remember(next.game, next.query);
    openSearch(next.game, next.query);
  };

  const handleRecent = (item: RecentSearch) => {
    search.apply(item.game, item.query);
    openSearch(item.game, item.query);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Üdv újra,{" "}
              <span className="text-blue-400">{user?.username ?? "Játékos"}</span>!
            </h1>
            <p className="text-gray-400 mt-2">
              Keress rá bármely játékos profiljára League of Legends vagy
              Teamfight Tactics játékokban.
            </p>
          </div>
          <Link
            href="/friends"
            className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-xl transition inline-flex items-center gap-2"
          >
            <Users className="size-4 text-blue-400" aria-hidden />
            Barátok
          </Link>
        </div>

        {profileError && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-xl inline-flex items-start gap-2">
            <XCircle className="size-5 shrink-0 mt-0.5" aria-hidden />
            <span>{profileError}</span>
          </div>
        )}

        <RiotAccountSection
          linkedRiot={user?.riot ?? null}
          input={riot.input}
          busy={riot.busy}
          error={riot.error}
          message={riot.message}
          onInputChange={riot.setInput}
          onLink={riot.link}
          onUnlink={riot.unlink}
        />

        <GamePicker selectedId={search.game} onSelect={search.setGame} />

        <PlayerSearchBar
          gameId={search.game}
          query={search.query}
          error={search.error}
          onQueryChange={search.setQuery}
          onSubmit={handleSearch}
        />

        <RecentSearchList items={recent.items} onPick={handleRecent} />
      </div>
    </div>
  );
}
