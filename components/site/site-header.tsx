"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/movies", label: "영화 둘러보기" },
  { href: "/impressions/new", label: "감상 남기기" },
  { href: "/me", label: "나의 여운" },
] as const;

export function SiteHeader() {
  const router = useRouter();
  const isSupabaseConfigured = hasSupabaseConfig();
  const [isCheckingAuth, setIsCheckingAuth] = useState(isSupabaseConfigured);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    async function applyUserState(userId: string | null) {
      if (!isMounted) {
        return;
      }

      setIsLoggedIn(Boolean(userId));
      setIsAdmin(false);

      if (!userId) {
        setIsCheckingAuth(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Admin role lookup failed in header", error);
      }

      setIsAdmin(profile?.role === "admin");
      setIsCheckingAuth(false);
    }

    supabase.auth.getUser().then(({ data }) => {
      void applyUserState(data.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applyUserState(session?.user.id ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  async function handleSignOut() {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setIsAdmin(false);
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#fff7ea]/10 bg-[#12100f]/88 backdrop-blur">
      <div className="mx-auto flex w-full flex-col gap-4 px-6 py-4 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-20">
        <Link
          href="/"
          className="text-xl font-semibold tracking-[0.08em] text-[#fff7ea]"
        >
          여운
        </Link>
        <nav aria-label="주요 메뉴" className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#e7d4c0] transition hover:bg-[#fff7ea]/8 hover:text-[#fff7ea] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
            >
              {item.label}
            </Link>
          ))}
          {isLoggedIn && isAdmin ? (
            <Link
              href="/admin/reports"
              className="rounded-full border border-[#f0a15f]/28 bg-[#f0a15f]/10 px-4 py-2 text-sm font-semibold text-[#ffd3a3] transition hover:border-[#f0a15f]/45 hover:bg-[#f0a15f]/16 focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
            >
              신고 관리
            </Link>
          ) : null}
          {isCheckingAuth ? null : isLoggedIn ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-[#fff7ea]/16 px-4 py-2 text-sm font-medium text-[#e7d4c0] transition hover:bg-[#fff7ea]/8 hover:text-[#fff7ea] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
            >
              로그아웃
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-[#f0a15f]/35 bg-[#f0a15f]/12 px-4 py-2 text-sm font-semibold text-[#ffd3a3] transition hover:border-[#f0a15f]/55 hover:bg-[#f0a15f]/20 focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
