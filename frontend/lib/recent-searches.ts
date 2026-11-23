export type RecentSearch = {
  game: string;
  query: string;
};

const STORAGE_KEY = "recentSearches";
const MAX_RECENT = 5;
const EMPTY_SEARCHES: RecentSearch[] = [];

let snapshot: RecentSearch[] = EMPTY_SEARCHES;
let hydrated = false;
const listeners = new Set<() => void>();

function isRecentSearch(value: unknown): value is RecentSearch {
  if (typeof value !== "object" || value === null) return false;

  const entry = value as Record<string, unknown>;
  return typeof entry.game === "string" && typeof entry.query === "string";
}

function loadSnapshot(): RecentSearch[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY_SEARCHES;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return EMPTY_SEARCHES;
    }

    const items = parsed.filter(isRecentSearch).slice(0, MAX_RECENT);
    return items.length === 0 ? EMPTY_SEARCHES : items;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return EMPTY_SEARCHES;
  }
}

export function subscribeRecentSearches(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function readRecentSearches(): RecentSearch[] {
  if (typeof window === "undefined") return EMPTY_SEARCHES;
  if (!hydrated) {
    snapshot = loadSnapshot();
    hydrated = true;
  }
  return snapshot;
}

export function getServerRecentSearches(): RecentSearch[] {
  return EMPTY_SEARCHES;
}

export function rememberRecentSearch(entry: RecentSearch): void {
  const updated = [
    entry,
    ...readRecentSearches().filter((item) => item.query !== entry.query),
  ].slice(0, MAX_RECENT);

  snapshot = updated.length === 0 ? EMPTY_SEARCHES : updated;
  hydrated = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  listeners.forEach((listener) => listener());
}
