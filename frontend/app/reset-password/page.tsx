"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!token) {
      setError("Hiányzó vagy érvénytelen visszaállító token.");
      return;
    }

    if (password.length < 6) {
      setError("A jelszónak legalább 6 karakternek kell lennie!");
      return;
    }

    if (password !== confirm) {
      setError("A két jelszó nem egyezik!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Hiba történt!");
        return;
      }

      setMessage(data.message || "A jelszavad sikeresen frissült.");
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
      <h1 className="text-2xl font-bold text-white mb-2 text-center">
        Új jelszó megadása
      </h1>
      <p className="text-gray-400 text-sm text-center mb-6">
        Állíts be egy új jelszót a fiókodhoz.
      </p>

      {!token && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded mb-4">
          Érvénytelen link. Kérj új jelszó-visszaállítást.
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-4 py-2 rounded mb-4 text-sm">
          {message}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <input
          type="password"
          placeholder="Új jelszó"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          placeholder="Új jelszó még egyszer"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !token}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? "Mentés..." : "Jelszó mentése"}
        </button>
      </div>

      <p className="text-gray-400 text-center mt-4">
        <Link href="/login" className="text-blue-400 hover:underline">
          Vissza a bejelentkezéshez
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <Suspense
        fallback={
          <div className="text-gray-400">Betöltés...</div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
