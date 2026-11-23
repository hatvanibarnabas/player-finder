"use client";

import { useState } from "react";

export function useForgotPassword() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [debugUrl, setDebugUrl] = useState("");

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    setDebugUrl("");
    setLoading(true);

    try {
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Hiba történt!");
        return;
      }

      setMessage(
        data.message ||
          "Ha ez az email regisztrálva van, küldtünk egy jelszó-visszaállító linket.",
      );
      if (data.debug_reset_url) {
        setDebugUrl(data.debug_reset_url);
      }
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez!");
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    error,
    message,
    loading,
    debugUrl,
    setEmail,
    setError,
    setMessage,
    setLoading,
    setDebugUrl,
    handleSubmit,
  };
}
