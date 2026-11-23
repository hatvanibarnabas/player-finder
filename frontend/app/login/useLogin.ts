"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { loginRequest } from "./login-api";

export function useLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await loginRequest(email, password);
      if (!result.ok) {
        setError(result.error);
        return false;
      }

      if (!result.data.token || !result.data.user) {
        setError("Hiba történt!");
        return false;
      }

      login(result.data.token, result.data.user);
      return true;
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, error, loading, submit };
}
