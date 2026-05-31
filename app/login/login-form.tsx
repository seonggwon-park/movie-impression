"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigStatus,
  hasSupabaseConfig,
  upsertUserProfile,
} from "@/lib/supabase";

type AuthMode = "login" | "signup";

const missingSupabaseEnvMessage =
  "Supabase 환경변수가 설정되지 않았어요. .env.local을 확인해주세요.";

function getNextPath() {
  if (typeof window === "undefined") {
    return "/me";
  }

  const nextPath = new URLSearchParams(window.location.search).get("next");

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/me";
  }

  return nextPath;
}

function SupabaseDebugPanel() {
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowDebugPanel(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!showDebugPanel) {
    return null;
  }

  const configStatus = getSupabaseConfigStatus();

  return (
    <div className="mt-6 rounded-lg border border-[#fff7ea]/10 bg-[#12100f]/42 p-4 text-sm leading-6 text-[#c9ad96]">
      <p className="font-medium text-[#f2b482]">개발용 Supabase 설정 확인</p>
      <dl className="mt-3 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <dt>NEXT_PUBLIC_SUPABASE_URL</dt>
          <dd className="font-medium text-[#fff7ea]">
            {configStatus.hasUrl ? "있음" : "없음"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>NEXT_PUBLIC_SUPABASE_ANON_KEY</dt>
          <dd className="font-medium text-[#fff7ea]">
            {configStatus.hasAnonKey ? "있음" : "없음"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt>Supabase URL host</dt>
          <dd className="font-medium text-[#fff7ea]">
            {configStatus.urlHost ?? "없음"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted || !data.user) {
        return;
      }

      router.replace(getNextPath());
    });

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!hasSupabaseConfig()) {
      setErrorMessage(missingSupabaseEnvMessage);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("비밀번호는 6자 이상 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    const supabase = getSupabaseBrowserClient();
    const trimmedEmail = email.trim();

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error || !data.user) {
        setErrorMessage("이메일 또는 비밀번호를 확인해주세요.");
        setIsSubmitting(false);
        return;
      }

      const { error: profileError } = await upsertUserProfile(
        supabase,
        data.user,
      );

      if (profileError) {
        setErrorMessage("로그인은 되었지만 프로필을 준비하지 못했어요.");
        setIsSubmitting(false);
        return;
      }

      router.push(getNextPath());
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo:
          typeof window === "undefined" ? undefined : window.location.origin,
      },
    });

    if (error) {
      console.error("Supabase signUp failed", error);
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (!data.user) {
      console.error("Supabase signUp returned no user", data);
      setErrorMessage("가입 요청 후 사용자 정보를 받지 못했어요.");
      setIsSubmitting(false);
      return;
    }

    if (!data.session) {
      setSuccessMessage(
        "가입 확인 메일을 보냈어요. 이메일 확인 후 다시 로그인해주세요.",
      );
      setIsSubmitting(false);
      return;
    }

    const { error: profileError } = await upsertUserProfile(
      supabase,
      data.user,
    );

    if (profileError) {
      setErrorMessage("계정은 만들어졌지만 프로필을 준비하지 못했어요.");
      setIsSubmitting(false);
      return;
    }

    router.push(getNextPath());
    router.refresh();
  }

  if (!hasSupabaseConfig()) {
    return (
      <Card className="p-6 sm:p-8">
        <p className="text-sm font-medium text-[#f2b482]">설정 필요</p>
        <h2 className="mt-3 text-2xl font-semibold text-[#fff7ea]">
          {missingSupabaseEnvMessage}
        </h2>
        <p className="mt-4 text-sm leading-6 text-[#c9ad96]">
          `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과
          `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 채우면 이메일 로그인을 사용할 수
          있어요.
        </p>
        <SupabaseDebugPanel />
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="grid grid-cols-2 rounded-full border border-[#fff7ea]/12 bg-[#12100f]/42 p-1">
        {(["login", "signup"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setMode(item);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className={
              mode === item
                ? "rounded-full bg-[#ffd3a3] px-4 py-2 text-sm font-semibold text-[#1f1208]"
                : "rounded-full px-4 py-2 text-sm font-medium text-[#e7d4c0] transition hover:bg-[#fff7ea]/8 hover:text-[#fff7ea]"
            }
          >
            {item === "login" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="email"
            className="text-sm font-medium text-[#f2b482]"
          >
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-3 w-full rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium text-[#f2b482]"
          >
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="6자 이상 입력해주세요"
            className="mt-3 w-full rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
          />
        </div>

        {errorMessage ? (
          <p className="rounded-lg border border-[#f4c7d8]/24 bg-[#f4c7d8]/10 px-4 py-3 text-sm font-medium text-[#f4c7d8]">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-lg border border-[#f0a15f]/24 bg-[#f0a15f]/10 px-4 py-3 text-sm font-medium text-[#ffd3a3]">
            {successMessage}
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting
            ? "잠시만 기다려주세요"
            : mode === "login"
              ? "로그인"
              : "회원가입"}
        </Button>
      </form>

      <SupabaseDebugPanel />
    </Card>
  );
}
