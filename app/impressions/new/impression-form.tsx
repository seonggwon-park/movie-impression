"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, EmotionTag } from "@/components/ui";
import type { EmotionTone } from "@/lib/placeholder-data";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
  upsertUserProfile,
} from "@/lib/supabase";

type MovieOption = {
  id: string;
  title: string;
};

type EmotionOption = {
  id: string;
  name: string;
};

const missingSupabaseEnvMessage =
  "Supabase 환경변수가 설정되지 않았어요. .env.local을 확인해주세요.";

const emotionToneByName: Record<string, EmotionTone> = {
  먹먹함: "warm",
  설렘: "rose",
  위로됨: "violet",
  통쾌함: "warm",
  찝찝함: "violet",
  무서움: "violet",
  혼란스러움: "violet",
  따뜻함: "warm",
  슬픔: "rose",
  웃김: "warm",
  압도됨: "rose",
  "여운 남음": "warm",
};

function getLoginPath() {
  return `/login?next=${encodeURIComponent("/impressions/new")}`;
}

function getRequestedMovieId() {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get("movieId");
}

function getEmotionTone(emotionName: string): EmotionTone {
  return emotionToneByName[emotionName] ?? "warm";
}

export function ImpressionForm() {
  const router = useRouter();
  const isSupabaseConfigured = hasSupabaseConfig();
  const [movies, setMovies] = useState<MovieOption[]>([]);
  const [emotions, setEmotions] = useState<EmotionOption[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [selectedEmotionIds, setSelectedEmotionIds] = useState<string[]>([]);
  const [oneLine, setOneLine] = useState("");
  const [note, setNote] = useState("");
  const [rating, setRating] = useState("");
  const [watchedAt, setWatchedAt] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] =
    useState(isSupabaseConfigured);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    isSupabaseConfigured ? "" : missingSupabaseEnvMessage,
  );
  const [movieSelectionMessage, setMovieSelectionMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    async function loadFormOptions() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError) {
        console.error("Supabase getUser failed", userError);
      }

      if (!userData.user) {
        router.replace(getLoginPath());
        return;
      }

      const [moviesResult, emotionsResult] = await Promise.all([
        supabase.from("movies").select("id, title").order("title"),
        supabase.from("emotions").select("id, name").order("name"),
      ]);

      if (!isMounted) {
        return;
      }

      if (moviesResult.error) {
        console.error("Supabase movies load failed", moviesResult.error);
        setErrorMessage(
          `영화 목록을 불러오지 못했어요. ${moviesResult.error.message}`,
        );
      }

      if (emotionsResult.error) {
        console.error("Supabase emotions load failed", emotionsResult.error);
        setErrorMessage(
          `감정 목록을 불러오지 못했어요. ${emotionsResult.error.message}`,
        );
      }

      const loadedMovies = (moviesResult.data ?? []) as MovieOption[];
      const loadedEmotions = (emotionsResult.data ?? []) as EmotionOption[];
      const requestedMovieId = getRequestedMovieId();
      const requestedMovie = loadedMovies.find(
        (movie) => movie.id === requestedMovieId,
      );

      setMovies(loadedMovies);
      setEmotions(loadedEmotions);
      setSelectedMovieId(requestedMovie?.id ?? loadedMovies[0]?.id ?? "");
      setMovieSelectionMessage(
        requestedMovieId && !requestedMovie
          ? "선택한 영화를 찾을 수 없어 직접 선택해주세요."
          : "",
      );
      setIsLoadingOptions(false);
    }

    loadFormOptions();

    return () => {
      isMounted = false;
    };
  }, [isSupabaseConfigured, router]);

  function toggleEmotion(emotionId: string) {
    setErrorMessage("");
    setSuccessMessage("");
    setSelectedEmotionIds((current) =>
      current.includes(emotionId)
        ? current.filter((item) => item !== emotionId)
        : [...current, emotionId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!selectedMovieId) {
      setErrorMessage("영화를 선택해주세요.");
      return;
    }

    if (selectedEmotionIds.length === 0) {
      setErrorMessage("마음에 남은 감정을 하나 이상 골라주세요.");
      return;
    }

    const trimmedOneLine = oneLine.trim();

    if (!trimmedOneLine) {
      setErrorMessage("한 줄 감상을 남겨주세요.");
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMessage(missingSupabaseEnvMessage);
      return;
    }

    setIsSubmitting(true);

    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Supabase getUser failed", userError);
    }

    if (!userData.user) {
      setIsSubmitting(false);
      router.replace(getLoginPath());
      return;
    }

    const { error: profileError } = await upsertUserProfile(
      supabase,
      userData.user,
    );

    if (profileError) {
      console.error("Supabase profile upsert failed", profileError);
      setErrorMessage(`프로필을 준비하지 못했어요. ${profileError.message}`);
      setIsSubmitting(false);
      return;
    }

    const { data: impressionData, error: impressionError } = await supabase
      .from("impressions")
      .insert({
        user_id: userData.user.id,
        movie_id: selectedMovieId,
        one_line: trimmedOneLine,
        note: note.trim() || null,
        rating: rating ? Number(rating) : null,
        is_spoiler: isSpoiler,
        watched_at: watchedAt || null,
      })
      .select("id")
      .single();

    if (impressionError) {
      console.error("Supabase impression insert failed", impressionError);
      setErrorMessage(`감상을 저장하지 못했어요. ${impressionError.message}`);
      setIsSubmitting(false);
      return;
    }

    const impression = impressionData as { id: string } | null;

    if (!impression?.id) {
      setErrorMessage("감상을 저장했지만 식별자를 받지 못했어요.");
      setIsSubmitting(false);
      return;
    }

    const emotionRows = selectedEmotionIds.map((emotionId) => ({
      impression_id: impression.id,
      emotion_id: emotionId,
    }));

    const { error: emotionLinkError } = await supabase
      .from("impression_emotions")
      .insert(emotionRows);

    if (emotionLinkError) {
      console.error(
        "Supabase impression_emotions insert failed",
        emotionLinkError,
      );
      setErrorMessage(
        `감정 태그를 저장하지 못했어요. ${emotionLinkError.message}`,
      );
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("감상이 저장됐어요. 나의 여운에서 다시 볼 수 있어요.");
    window.setTimeout(() => {
      router.push("/me");
      router.refresh();
    }, 900);
  }

  return (
    <Card className="mt-10 max-w-4xl p-6 sm:p-8">
      <form className="space-y-9" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="movie"
            className="text-sm font-medium text-[#f2b482]"
          >
            어떤 영화를 보셨나요?
          </label>
          <select
            id="movie"
            name="movie"
            value={selectedMovieId}
            onChange={(event) => {
              setSelectedMovieId(event.target.value);
              setMovieSelectionMessage("");
            }}
            disabled={isLoadingOptions || movies.length === 0}
            className="mt-3 w-full rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 text-[#fff7ea] outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
          >
            {movies.length > 0 ? (
              movies.map((movie) => (
                <option key={movie.id} value={movie.id}>
                  {movie.title}
                </option>
              ))
            ) : (
              <option value="">
                {isLoadingOptions
                  ? "영화를 불러오는 중이에요"
                  : "등록된 영화가 없어요"}
              </option>
            )}
          </select>
          {!isLoadingOptions && movies.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-[#c9ad96]">
              아직 선택할 수 있는 영화가 없어요. Supabase movies 테이블의
              seed 데이터를 확인해주세요.
            </p>
          ) : null}
          {movieSelectionMessage ? (
            <p className="mt-3 rounded-lg border border-[#f0a15f]/20 bg-[#f0a15f]/10 px-4 py-3 text-sm leading-6 text-[#ffd3a3]">
              {movieSelectionMessage}
            </p>
          ) : null}
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-[#f2b482]">
            마음에 남은 감정
          </legend>
          <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
            하나만 골라도, 여러 개를 골라도 괜찮아요.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {emotions.length > 0 ? (
              emotions.map((emotion) => (
                <EmotionTag
                  key={emotion.id}
                  selected={selectedEmotionIds.includes(emotion.id)}
                  tone={getEmotionTone(emotion.name)}
                  onClick={() => toggleEmotion(emotion.id)}
                >
                  {emotion.name}
                </EmotionTag>
              ))
            ) : (
              <p className="rounded-lg border border-[#fff7ea]/10 bg-[#fff7ea]/5 px-4 py-3 text-sm leading-6 text-[#c9ad96]">
                {isLoadingOptions
                  ? "감정을 불러오는 중이에요."
                  : "아직 선택할 수 있는 감정이 없어요. Supabase emotions 테이블의 seed 데이터를 확인해주세요."}
              </p>
            )}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="one-line-impression"
            className="flex items-center gap-2 text-sm font-medium text-[#f2b482]"
          >
            한 줄만 남겨도 괜찮아요
            <span className="rounded-full bg-[#f0a15f]/14 px-2 py-1 text-xs text-[#ffd3a3]">
              필수
            </span>
          </label>
          <textarea
            id="one-line-impression"
            name="oneLineImpression"
            rows={3}
            maxLength={90}
            required
            value={oneLine}
            onChange={(event) => setOneLine(event.target.value)}
            placeholder="영화가 끝나고 어떤 마음이 남았나요?"
            className="mt-3 w-full resize-none rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 leading-7 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
          />
        </div>

        <div>
          <label
            htmlFor="longer-note"
            className="text-sm font-medium text-[#f2b482]"
          >
            조금 더 남기고 싶은 감상
          </label>
          <textarea
            id="longer-note"
            name="longerNote"
            rows={5}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="기억하고 싶은 장면이나 감정을 자유롭게 적어보세요."
            className="mt-3 w-full resize-none rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 leading-7 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="rating"
              className="text-sm font-medium text-[#c9ad96]"
            >
              별점은 남기고 싶을 때만
            </label>
            <select
              id="rating"
              name="rating"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              className="mt-3 w-full rounded-lg border border-[#fff7ea]/10 bg-[#12100f] px-4 py-3 text-[#e7d4c0] outline-none transition focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
            >
              <option value="">남기지 않기</option>
              <option value="1">1점</option>
              <option value="2">2점</option>
              <option value="3">3점</option>
              <option value="4">4점</option>
              <option value="5">5점</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="watched-date"
              className="text-sm font-medium text-[#c9ad96]"
            >
              본 날짜
            </label>
            <input
              id="watched-date"
              name="watchedDate"
              type="date"
              value={watchedAt}
              onChange={(event) => setWatchedAt(event.target.value)}
              className="mt-3 w-full rounded-lg border border-[#fff7ea]/10 bg-[#12100f] px-4 py-3 text-[#e7d4c0] outline-none transition focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-[#fff7ea]/10 bg-[#fff7ea]/5 px-4 py-3 text-sm leading-6 text-[#e7d4c0]">
          <input
            name="hasSpoiler"
            type="checkbox"
            checked={isSpoiler}
            onChange={(event) => setIsSpoiler(event.target.checked)}
            className="h-4 w-4 accent-[#f0a15f]"
          />
          스포일러가 포함되어 있어요
        </label>

        {errorMessage ? (
          <p className="rounded-lg border border-[#f4c7d8]/24 bg-[#f4c7d8]/10 px-4 py-3 text-sm font-medium leading-6 text-[#f4c7d8]">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-lg border border-[#f0a15f]/24 bg-[#f0a15f]/10 px-4 py-3 text-sm font-medium text-[#ffd3a3]">
            {successMessage}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="submit"
            disabled={
              isLoadingOptions ||
              isSubmitting ||
              movies.length === 0 ||
              emotions.length === 0
            }
          >
            {isSubmitting ? "감상을 저장하는 중이에요" : "감상 남기기"}
          </Button>
          <p className="text-sm leading-6 text-[#c9ad96]">
            저장 후 나의 여운에서 다시 볼 수 있어요.
          </p>
        </div>
      </form>
    </Card>
  );
}
