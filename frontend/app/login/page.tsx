"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLogin } from "./useLogin";

export default function LoginPage() {
  const router = useRouter();
  const form = useLogin();

  const handleLogin = async () => {
    const ok = await form.submit();
    if (!ok) return;

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Bejelentkezés
        </h1>

        {form.error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-2 rounded mb-4">
            {form.error}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(event) => form.setEmail(event.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Jelszó"
            value={form.password}
            onChange={(event) => form.setPassword(event.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleLogin}
            disabled={form.loading}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {form.loading ? "Bejelentkezés..." : "Bejelentkezés"}
          </button>
          <Link
            href="/forgot-password"
            className="text-center text-sm text-blue-400 hover:underline"
          >
            Elfelejtetted a jelszavad?
          </Link>
        </div>

        <p className="text-gray-400 text-center mt-4">
          Még nincs fiókod?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            Regisztrálj!
          </Link>
        </p>
      </div>
    </div>
  );
}
