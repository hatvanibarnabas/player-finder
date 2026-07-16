export function getAuthToken(): string {
  if (typeof window === "undefined") return "";

  const fromStorage = localStorage.getItem("token");
  if (fromStorage) return fromStorage;

  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1] ?? ""
  );
}

export function isLoggedIn(): boolean {
  return getAuthToken() !== "";
}
