"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink, Card, EmotionTag } from "@/components/ui";
import type { EmotionTone } from "@/lib/emotions";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase";

type MaybeArray<T> = T | T[] | null;

type SupabaseMovieRow = {
  id: string;
  title: string;
  slug: string | null;
  poster_url: string | null;
  release_date: string | null;
};

type SupabaseEmotionRow = {
  id: string;
  name: string;
  emoji: string | null;
};

type SupabaseImpressionRow = {
  id: string;
  one_line: string;
  note: string | null;
  rating: number | null;
  is_spoiler: boolean | null;
  watched_at: string | null;
  movies: MaybeArray<SupabaseMovieRow>;
  impression_emotions:
    | Array<{
        emotion_id: string;
        emotions: MaybeArray<SupabaseEmotionRow>;
      }>
    | null;
};

type EmotionOption = {
  id: string;
  name: string;
  emoji: string | null;
};

type MovieView = {
  id: string;
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
};

type EditImpressionFormProps = {
  impressionId: string;
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

function getLoginPath(impressionId: string) {
  return `/login?next=${encodeURIComponent(
    `/impressions/${impressionId}/edit`,
  )}`;
}

function getSingleRelation<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getEmotionTone(emotionName: string): EmotionTone {
  return emotionToneByName[emotionName] ?? "warm";
}

function getEmotionLabel(emotion: EmotionOption) {
  return emotion.emoji ? `${emotion.emoji} ${emotion.name}` : emotion.name;
}

function getReleaseYear(value: string | null) {
  return value ? value.slice(0, 4) : null;
}

export function EditImpressionForm({
  impressionId,
}: EditImpressionFormProps) {
  const router = useRouter();
  const isSupabaseConfigured = hasSupabaseConfig();
  const [movie, setMovie] = useState<MovieView | null>(null);
  const [emotions, setEmotions] = useState<EmotionOption[]>([]);
  const [selectedEmotionIds, setSelectedEmotionIds] = useState<string[]>([]);
  const [oneLine, setOneLine] = useState("");
  const [note, setNote] = useState("");
  const [rating, setRating] = useState("");
  const [watchedAt, setWatchedAt] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    isSupabaseConfigured ? "" : missingSupabaseEnvMessage,
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    async function loadImpression() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError) {
        console.error("Supabase getUser failed", userError);
      }

      if (!userData.user) {
        router.replace(getLoginPath(impressionId));
        return;
      }

      const [impressionResult, emotionsResult] = await Promise.all([
        supabase
          .from("impressions")
          .select(
            `
            id,
            one_line,
            note,
            rating,
            is_spoiler,
            watched_at,
            movies (
              id,
              title,
              slug,
              poster_url,
              release_date
            ),
            impression_emotions (
              emotion_id,
              emotions (
                id,
                name,
                emoji
              )
            )
          `,
          )
          .eq("id", impressionId)
          .eq("user_id", userData.user.id)
          .maybeSingle(),
        supabase.from("emotions").select("id, name, emoji").order("name"),
      ]);

      if (!isMounted) {
        return;
      }

      if (impressionResult.error) {
        console.error("Supabase edit impression load failed", {
          error: impressionResult.error,
          impressionId,
        });
        setErrorMessage(
          `감상을 불러오지 못했어요. ${impressionResult.error.message}`,
        );
        setIsLoading(false);
        return;
      }

      if (emotionsResult.error) {
        console.error("Supabase emotions load failed", emotionsResult.error);
        setErrorMessage(
          `감정 목록을 불러오지 못했어요. ${emotionsResult.error.message}`,
        );
        setIsLoading(false);
        return;
      }

      const row = impressionResult.data as SupabaseImpressionRow | null;

      if (!row) {
        setErrorMessage("수정할 감상을 찾지 못했어요.");
        setIsLoading(false);
        return;
      }

      const movieRow = getSingleRelation(row.movies);
      const selectedIds =
        row.impression_emotions
          ?.map((item) => item.emotion_id || getSingleRelation(item.emotions)?.id)
          .filter((emotionId): emotionId is string => Boolean(emotionId)) ?? [];

      setMovie({
        id: movieRow?.id ?? "",
        title: movieRow?.title ?? "제목 없는 영화",
        posterUrl: movieRow?.poster_url ?? null,
        releaseDate: movieRow?.release_date ?? null,
      });
      setEmotions((emotionsResult.data ?? []) as EmotionOption[]);
      setSelectedEmotionIds(selectedIds);
      setOneLine(row.one_line);
      setNote(row.note ?? "");
      setRating(row.rating ? String(row.rating) : "");
      setWatchedAt(row.watched_at ?? "");
      setIsSpoiler(Boolean(row.is_spoiler));
      setIsLoading(false);
    }

    loadImpression();

    return () => {
      isMounted = false;
    };
  }, [impressionId, isSupabaseConfigured, router]);

  function toggleEmotion(emotionId: string) {
    setErrorMessage("");
    setSelectedEmotionIds((current) =>
      current.includes(emotionId)
        ? current.filter((item) => item !== emotionId)
        : [...current, emotionId],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

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

    setIsSaving(true);

    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Supabase getUser failed before updating impression", userError);
    }

    if (!userData.user) {
      setIsSaving(false);
      router.replace(getLoginPath(impressionId));
      return;
    }

    const { data: updatedImpression, error: updateError } = await supabase
      .from("impressions")
      .update({
        one_line: trimmedOneLine,
        note: note.trim() || null,
        rating: rating ? Number(rating) : null,
        is_spoiler: isSpoiler,
        watched_at: watchedAt || null,
      })
      .eq("id", impressionId)
      .eq("user_id", userData.user.id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Supabase impression update failed", updateError);
      setErrorMessage(`감상을 수정하지 못했어요. ${updateError.message}`);
      setIsSaving(false);
      return;
    }

    if (!updatedImpression) {
      setErrorMessage("수정할 감상을 찾지 못했어요.");
      setIsSaving(false);
      return;
    }

    const { error: deleteEmotionError } = await supabase
      .from("impression_emotions")
      .delete()
      .eq("impression_id", impressionId);

    if (deleteEmotionError) {
      console.error("Supabase impression emotion delete failed", deleteEmotionError);
      setErrorMessage(
        `기존 감정 태그를 정리하지 못했어요. ${deleteEmotionError.message}`,
      );
      setIsSaving(false);
      return;
    }

    const emotionRows = selectedEmotionIds.map((emotionId) => ({
      impression_id: impressionId,
      emotion_id: emotionId,
    }));

    const { error: insertEmotionError } = await supabase
      .from("impression_emotions")
      .insert(emotionRows);

    if (insertEmotionError) {
      console.error("Supabase impression emotion insert failed", insertEmotionError);
      setErrorMessage(
        `감정 태그를 다시 저장하지 못했어요. ${insertEmotionError.message}`,
      );
      setIsSaving(false);
      return;
    }

    router.push("/me");
    router.refresh();
  }

  if (isLoading) {
    return (
      <Card className="mt-10 max-w-4xl p-6 sm:p-8">
        <p className="text-sm font-medium text-[#f2b482]">
          감상을 불러오는 중
        </p>
        <p className="mt-3 text-xl font-semibold leading-8 text-[#fff7ea]">
          남겨둔 감정과 문장을 조용히 꺼내고 있어요.
        </p>
      </Card>
    );
  }

  if (!movie && errorMessage) {
    return (
      <Card className="mt-10 max-w-4xl border-[#f4c7d8]/24 bg-[#f4c7d8]/10 p-6 sm:p-8">
        <p className="text-sm font-medium text-[#f4c7d8]">불러오기 오류</p>
        <p className="mt-3 text-base leading-7 text-[#f4c7d8]">
          {errorMessage}
        </p>
        <ButtonLink href="/me" variant="secondary" className="mt-6">
          나의 여운으로 돌아가기
        </ButtonLink>
      </Card>
    );
  }

  const releaseYear = getReleaseYear(movie?.releaseDate ?? null);

  return (
    <Card className="mt-10 max-w-4xl p-6 sm:p-8">
      <form className="space-y-9" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-medium text-[#f2b482]">감상한 영화</p>
          <div className="mt-3 flex gap-4 rounded-lg border border-[#fff7ea]/10 bg-[#fff7ea]/5 p-4">
            <div
              aria-label={`${movie?.title ?? "영화"} 포스터`}
              className="min-h-28 w-20 shrink-0 rounded-md border border-[#fff7ea]/10 bg-[linear-gradient(145deg,rgba(240,161,95,0.24),rgba(244,199,216,0.12),rgba(18,16,15,0.88))] bg-cover bg-center"
              role="img"
              style={
                movie?.posterUrl
                  ? { backgroundImage: `url(${movie.posterUrl})` }
                  : undefined
              }
            />
            <div className="min-w-0 self-center">
              <p className="text-xl font-semibold text-[#fff7ea]">
                {movie?.title ?? "제목 없는 영화"}
              </p>
              {releaseYear ? (
                <p className="mt-2 text-sm text-[#c9ad96]">{releaseYear}</p>
              ) : null}
              <p className="mt-3 text-sm leading-6 text-[#c9ad96]">
                영화는 바꾸지 않고 감상만 수정할 수 있어요.
              </p>
            </div>
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-[#f2b482]">
            마음에 남은 감정
          </legend>
          <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
            지금 기억나는 감정으로 다시 골라도 괜찮아요.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {emotions.map((emotion) => (
              <EmotionTag
                key={emotion.id}
                selected={selectedEmotionIds.includes(emotion.id)}
                tone={getEmotionTone(emotion.name)}
                onClick={() => toggleEmotion(emotion.id)}
              >
                {getEmotionLabel(emotion)}
              </EmotionTag>
            ))}
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="submit"
            disabled={isSaving || emotions.length === 0}
            className="disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "감상을 수정하는 중이에요" : "감상 수정"}
          </Button>
          <ButtonLink href="/me" variant="secondary">
            취소
          </ButtonLink>
          <p className="text-sm leading-6 text-[#c9ad96]">
            수정 후 나의 여운으로 돌아가요.
          </p>
        </div>
      </form>
    </Card>
  );
}
