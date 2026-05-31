"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase";

type AuthGuardProps = {
  children: ReactNode;
};

function getLoginPath(pathname: string) {
  return `/login?next=${encodeURIComponent(pathname)}`;
}

function getCurrentPath(pathname: string) {
  if (typeof window === "undefined") {
    return pathname;
  }

  return `${window.location.pathname}${window.location.search}`;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const currentPath = getCurrentPath(pathname);

    if (!hasSupabaseConfig()) {
      router.replace(getLoginPath(currentPath));
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      if (data.user) {
        setIsAllowed(true);
        return;
      }

      router.replace(getLoginPath(currentPath));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAllowed(true);
        return;
      }

      setIsAllowed(false);
      router.replace(getLoginPath(currentPath));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (!isAllowed) {
    return (
      <main className="bg-[#12100f] text-[#fff7ea]">
        <section className="mx-auto min-h-[55vh] w-full px-6 py-20 sm:px-10 lg:px-20">
          <div className="max-w-xl rounded-lg border border-[#fff7ea]/12 bg-[#fff7ea]/7 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.22)]">
            <p className="text-sm font-medium text-[#f2b482]">
              로그인 확인 중
            </p>
            <p className="mt-3 text-xl font-semibold leading-8 text-[#fff7ea]">
              나만의 여운을 불러오고 있어요.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return children;
}
