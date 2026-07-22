"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthToken } from "@/lib/auth";
import {
  ChevronDown,
  ChevronUp,
  LogOut,
  MessageCircle,
  Users,
} from "@/lib/icons";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; email: string } | null>(
    null,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem("user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadTotal(0);
      return;
    }

    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch(`${apiBase}/conversations/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          setUnreadTotal(Number(json.unread_total) || 0);
        }
      } catch {
        // ignore transient network errors
      }
    };

    fetchUnread();
    const id = window.setInterval(fetchUnread, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-bold text-white transition hover:text-blue-400"
        >
          PlayerFinder
        </Link>

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
            >
              <div className="relative w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                {user.username.charAt(0).toUpperCase()}
                {unreadTotal > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[10px] leading-4 text-center">
                    {unreadTotal > 9 ? "9+" : unreadTotal}
                  </span>
                )}
              </div>
              <span>{user.username}</span>
              {menuOpen ? (
                <ChevronUp className="size-4 text-gray-400" aria-hidden />
              ) : (
                <ChevronDown className="size-4 text-gray-400" aria-hidden />
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-gray-800 border border-gray-700 rounded-xl shadow-lg z-50">
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-white font-semibold">{user.username}</p>
                  <p className="text-gray-400 text-sm truncate">{user.email}</p>
                </div>
                <Link
                  href="/friends"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2 text-left px-4 py-3 text-gray-200 hover:bg-gray-700 transition"
                >
                  <Users className="size-4 text-blue-400" aria-hidden />
                  Barátok
                </Link>
                <Link
                  href="/messages"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center justify-between gap-2 text-left px-4 py-3 text-gray-200 hover:bg-gray-700 transition"
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle className="size-4 text-blue-400" aria-hidden />
                    Üzenetek
                  </span>
                  {unreadTotal > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-600 text-[11px] font-semibold inline-flex items-center justify-center">
                      {unreadTotal > 99 ? "99+" : unreadTotal}
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-left px-4 py-3 text-red-400 hover:bg-gray-700 rounded-b-xl transition"
                >
                  <LogOut className="size-4" aria-hidden />
                  Kijelentkezés
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-3">
            <Link
              href="/login"
              className="text-gray-300 hover:text-white transition px-4 py-2"
            >
              Bejelentkezés
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              Regisztráció
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
