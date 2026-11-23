"use client";

import Link from "next/link";
import { useForgotPassword } from "./useForgotPassword";

export default function ForgotPasswordPage() {
  const { email, error, message, loading, debugUrl, setEmail, handleSubmit } = useForgotPassword();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Elfelejtett jelszó
        </h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Add meg az email címed, és küldünk egy visszaállító linket.
        </p>

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

        {debugUrl && (
          <div className="bg-yellow-500/10 border border-yellow-600 text-yellow-200 px-4 py-2 rounded mb-4 text-sm break-all">
            Fejlesztői mód (MAIL_DRIVER=log):{" "}
            <Link href={debugUrl} className="underline text-yellow-100">
              Megnyitás
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !email.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? "Küldés..." : "Visszaállító link küldése"}
          </button>
        </div>

        <p className="text-gray-400 text-center mt-4">
          <Link href="/login" className="text-blue-400 hover:underline">
            Vissza a bejelentkezéshez
          </Link>
        </p>
      </div>
    </div>
  );
}
