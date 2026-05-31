"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ButtonLink,
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import {
  type EmotionTone,
  type Movie,
  emotionOptions,
  getMovieByIdOrSlug,
} from "@/lib/placeholder-data";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase";

type MaybeArray<T> = T | T[] | null;

type MovieDetailProps = {
  identifier: string;
};

type SupabaseMovieRow = {
  id: string;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_url: string | null;
  release_date: string | null;
  runtime: number | null;
  genres: string[] | null;
  slug: string | null;
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
  created_at: string | null;
  impression_emotions:
    | Array<{
        emotions: MaybeArray<SupabaseEmotionRow>;
      }>
    | null;
};

type SupabaseCriticReviewRow = {
  id: string;
  critic_name: string | null;
  outlet: string | null;
  rating: string | null;
  short_quote: string | null;
  source_url: string | null;
};

type SupabaseBookingLinkRow = {
  id: string;
  provider: string;
  url: string;
};

type EmotionView = {
  id: string;
  name: string;
  emoji: string | null;
};

type MovieView = {
  id: string;
  title: string;
  originalTitle: string | null;
  overview: string | null;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: string | null;
  runtimeLabel: string | null;
  genres: string[];
  slug: string | null;
};

type ImpressionView = {
  id: string;
  oneLine: string;
  note: string | null;
  rating: string | null;
  isSpoiler: boolean;
  watchedAt: string | null;
  createdAt: string | null;
  emotions: EmotionView[];
};

type CriticReviewView = {
  id: string;
  criticName: string;
  outlet: string;
  rating: string | null;
  shortQuote: string | null;
  sourceUrl: string | null;
};

type BookingLinkView = {
  id: string;
  provider: string;
  url: string;
};

type MovieDetailState = {
  movie: MovieView;
  impressions: ImpressionView[];
  criticReviews: CriticReviewView[];
  bookingLinks: BookingLinkView[];
  isFallback: boolean;
};

type MovieLookupDebug = {
  rawParam: string;
  decodedParam: string;
  attemptedUuidLookup: boolean;
  tmdbIdFallback: number | null;
};

const fallbackBookingLinks = [
  { id: "cgv", provider: "CGV", url: "https://www.cgv.co.kr/" },
  { id: "megabox", provider: "메가박스", url: "https://www.megabox.co.kr/" },
  {
    id: "lotte-cinema",
    provider: "롯데시네마",
    url: "https://www.lottecinema.co.kr/",
  },
] satisfies BookingLinkView[];

const emotionToneByLabel = new Map(
  emotionOptions.map((emotion) => [emotion.label, emotion.tone]),
);

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
}

function decodeMovieIdentifier(value: string) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    console.error("Movie route param decode failed", {
      rawParam: value,
      error,
    });

    return value;
  }
}

function getTrailingTmdbId(value: string) {
  const match = value.match(/-(\d+)$/);

  if (!match) {
    return null;
  }

  const tmdbId = Number(match[1]);

  return Number.isSafeInteger(tmdbId) && tmdbId > 0 ? tmdbId : null;
}

function formatLookupDebugDetail(debug: MovieLookupDebug) {
  return [
    `raw=${debug.rawParam}`,
    `decoded=${debug.decodedParam}`,
    `uuidLookup=${debug.attemptedUuidLookup ? "yes" : "no"}`,
    `tmdbId=${debug.tmdbIdFallback ?? "none"}`,
  ].join(" / ");
}

function getSingleRelation<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getEmotionTone(emotionName: string): EmotionTone {
  return emotionToneByLabel.get(emotionName) ?? "warm";
}

function getEmotionLabel(emotion: EmotionView) {
  return emotion.emoji ? `${emotion.emoji} ${emotion.name}` : emotion.name;
}

function getReleaseYear(value: string | null) {
  return value ? value.slice(0, 4) : null;
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function getNotePreview(note: string) {
  return note.length > 150 ? `${note.slice(0, 150)}...` : note;
}

function normalizeMovie(row: SupabaseMovieRow): MovieView {
  return {
    id: row.id,
    title: row.title,
    originalTitle: row.original_title,
    overview: row.overview,
    posterUrl: row.poster_url,
    releaseDate: row.release_date,
    releaseYear: getReleaseYear(row.release_date),
    runtimeLabel: row.runtime ? `${row.runtime}분` : null,
    genres: row.genres ?? [],
    slug: row.slug,
  };
}

function normalizeImpression(row: SupabaseImpressionRow): ImpressionView {
  const emotions =
    row.impression_emotions
      ?.map((item) => getSingleRelation(item.emotions))
      .filter((emotion): emotion is SupabaseEmotionRow => Boolean(emotion)) ??
    [];

  return {
    id: row.id,
    oneLine: row.one_line,
    note: row.note,
    rating: row.rating ? String(row.rating) : null,
    isSpoiler: Boolean(row.is_spoiler),
    watchedAt: row.watched_at,
    createdAt: row.created_at,
    emotions,
  };
}

function normalizeCriticReview(
  row: SupabaseCriticReviewRow,
): CriticReviewView {
  return {
    id: row.id,
    criticName: row.critic_name ?? "평론가",
    outlet: row.outlet ?? "출처 미상",
    rating: row.rating,
    shortQuote: row.short_quote,
    sourceUrl: row.source_url,
  };
}

function normalizeBookingLink(row: SupabaseBookingLinkRow): BookingLinkView {
  return {
    id: row.id,
    provider: row.provider,
    url: row.url,
  };
}

function createFallbackDetail(movie: Movie): MovieDetailState {
  const fallbackEmotions = movie.impressions.map((impression, index) => ({
    id: `${movie.id}-${impression.emotion}-${index}`,
    name: impression.emotion,
    emoji: null,
  }));

  return {
    movie: {
      id: movie.id,
      title: movie.title,
      originalTitle: movie.originalTitle ?? null,
      overview: movie.synopsis,
      posterUrl: null,
      releaseDate: null,
      releaseYear: movie.releaseYear,
      runtimeLabel: movie.runningTime,
      genres: [movie.genre],
      slug: movie.slug,
    },
    impressions: movie.impressions.map((impression, index) => ({
      id: `${movie.id}-fallback-${index}`,
      oneLine: impression.note,
      note: null,
      rating: impression.rating ?? null,
      isSpoiler: false,
      watchedAt: impression.date,
      createdAt: impression.date,
      emotions: [fallbackEmotions[index]],
    })),
    criticReviews: movie.criticReviews.map((review, index) => ({
      id: `${movie.id}-critic-${index}`,
      criticName: review.criticName,
      outlet: review.outlet,
      rating: review.rating ?? null,
      shortQuote: review.summary,
      sourceUrl: review.sourceUrl,
    })),
    bookingLinks: fallbackBookingLinks,
    isFallback: true,
  };
}

function getEmotionDistribution(impressions: ImpressionView[]) {
  const counts = impressions
    .flatMap((impression) => impression.emotions)
    .reduce<Record<string, { emotion: EmotionView; count: number }>>(
      (current, emotion) => ({
        ...current,
        [emotion.name]: {
          emotion,
          count: (current[emotion.name]?.count ?? 0) + 1,
        },
      }),
      {},
    );

  const total = Object.values(counts).reduce(
    (sum, item) => sum + item.count,
    0,
  );

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .map((item) => ({
      emotion: item.emotion,
      count: item.count,
      percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }));
}

async function fetchMovieByIdentifier(identifier: string) {
  const supabase = getSupabaseBrowserClient();
  const decodedIdentifier = decodeMovieIdentifier(identifier);
  const attemptedUuidLookup = isUuid(decodedIdentifier);
  const tmdbIdFallback = getTrailingTmdbId(decodedIdentifier);
  const lookupDebug: MovieLookupDebug = {
    rawParam: identifier,
    decodedParam: decodedIdentifier,
    attemptedUuidLookup,
    tmdbIdFallback,
  };
  const selectFields =
    "id, title, original_title, overview, poster_url, release_date, runtime, genres, slug";

  const slugResult = await supabase
    .from("movies")
    .select(selectFields)
    .eq("slug", decodedIdentifier)
    .maybeSingle();

  if (slugResult.error || slugResult.data) {
    return { lookupDebug, movieResult: slugResult };
  }

  if (attemptedUuidLookup) {
    const idResult = await supabase
      .from("movies")
      .select(selectFields)
      .eq("id", decodedIdentifier)
      .maybeSingle();

    if (idResult.error || idResult.data || !tmdbIdFallback) {
      return { lookupDebug, movieResult: idResult };
    }
  }

  if (tmdbIdFallback) {
    const tmdbResult = await supabase
      .from("movies")
      .select(selectFields)
      .eq("tmdb_id", tmdbIdFallback)
      .maybeSingle();

    return { lookupDebug, movieResult: tmdbResult };
  }

  return { lookupDebug, movieResult: slugResult };
}

export function MovieDetail({ identifier }: MovieDetailProps) {
  const isSupabaseConfigured = hasSupabaseConfig();
  const [detail, setDetail] = useState<MovieDetailState | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [errorMessage, setErrorMessage] = useState("");
  const [lookupDebugDetail, setLookupDebugDetail] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadMovieDetail() {
      const decodedIdentifier = decodeMovieIdentifier(identifier);
      const placeholderFallback = getMovieByIdOrSlug(decodedIdentifier);
      setErrorMessage("");
      setLookupDebugDetail("");

      if (!isSupabaseConfigured) {
        if (placeholderFallback) {
          setDetail(createFallbackDetail(placeholderFallback));
        } else {
          setErrorMessage(
            "Supabase 환경변수가 설정되지 않았고, 임시 영화 데이터도 찾지 못했어요.",
          );
        }
        setIsLoading(false);
        return;
      }

      const { lookupDebug, movieResult } =
        await fetchMovieByIdentifier(identifier);

      if (!isMounted) {
        return;
      }

      if (movieResult.error) {
        console.error("Supabase movie detail load failed", {
          error: movieResult.error,
          lookup: lookupDebug,
        });

        if (placeholderFallback) {
          setDetail(createFallbackDetail(placeholderFallback));
          setErrorMessage(
            `실제 영화 데이터를 불러오지 못해 임시 데이터를 보여주고 있어요. ${movieResult.error.message}`,
          );
        } else {
          setErrorMessage(
            `영화 정보를 불러오지 못했어요. ${movieResult.error.message}`,
          );
        }

        setIsLoading(false);
        return;
      }

      if (!movieResult.data) {
        if (placeholderFallback) {
          setDetail(createFallbackDetail(placeholderFallback));
        } else {
          console.error("Supabase movie lookup returned no data", lookupDebug);
          setErrorMessage("이 영화를 찾지 못했어요.");
          setLookupDebugDetail(formatLookupDebugDetail(lookupDebug));
        }

        setIsLoading(false);
        return;
      }

      const movie = normalizeMovie(movieResult.data as SupabaseMovieRow);
      const supabase = getSupabaseBrowserClient();

      const [impressionsResult, criticReviewsResult, bookingLinksResult] =
        await Promise.all([
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
              created_at,
              impression_emotions (
                emotions (
                  id,
                  name,
                  emoji
                )
              )
            `,
            )
            .eq("movie_id", movie.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("critic_reviews")
            .select("id, critic_name, outlet, rating, short_quote, source_url")
            .eq("movie_id", movie.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("booking_links")
            .select("id, provider, url")
            .eq("movie_id", movie.id),
        ]);

      if (!isMounted) {
        return;
      }

      const relatedErrors = [
        impressionsResult.error,
        criticReviewsResult.error,
        bookingLinksResult.error,
      ].filter(Boolean);

      relatedErrors.forEach((error) => {
        console.error("Supabase movie related data load failed", error);
      });

      if (relatedErrors[0]) {
        setErrorMessage(
          `영화의 관련 데이터를 일부 불러오지 못했어요. ${relatedErrors[0].message}`,
        );
      }

      setDetail({
        movie,
        impressions: ((impressionsResult.data ?? []) as SupabaseImpressionRow[])
          .map(normalizeImpression),
        criticReviews: (
          (criticReviewsResult.data ?? []) as SupabaseCriticReviewRow[]
        ).map(normalizeCriticReview),
        bookingLinks:
          ((bookingLinksResult.data ?? []) as SupabaseBookingLinkRow[]).map(
            normalizeBookingLink,
          ) ?? fallbackBookingLinks,
        isFallback: false,
      });
      setIsLoading(false);
    }

    loadMovieDetail();

    return () => {
      isMounted = false;
    };
  }, [identifier, isSupabaseConfigured]);

  const emotionDistribution = useMemo(
    () => getEmotionDistribution(detail?.impressions ?? []),
    [detail?.impressions],
  );
  const topEmotion = emotionDistribution[0]?.emotion;
  const activeBookingLinks =
    detail?.bookingLinks && detail.bookingLinks.length > 0
      ? detail.bookingLinks
      : fallbackBookingLinks;

  if (isLoading) {
    return (
      <main className="bg-[#12100f] text-[#fff7ea]">
        <PageContainer className="py-16 sm:py-24">
          <Card className="p-6">
            <p className="text-sm font-medium text-[#f2b482]">
              영화의 여운을 불러오는 중
            </p>
            <p className="mt-3 text-xl font-semibold leading-8 text-[#fff7ea]">
              감정과 감상을 조용히 정리하고 있어요.
            </p>
          </Card>
        </PageContainer>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="bg-[#12100f] text-[#fff7ea]">
        <PageContainer className="py-16 sm:py-24">
          <Link
            href="/movies"
            className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-[#c9ad96] transition hover:bg-[#fff7ea]/8 hover:text-[#fff7ea] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
          >
            영화 목록으로
          </Link>
          <Card className="mt-8 border-[#f4c7d8]/24 bg-[#f4c7d8]/10 p-6">
            <p className="text-sm font-medium text-[#f4c7d8]">
              불러오기 오류
            </p>
            <p className="mt-3 text-base leading-7 text-[#f4c7d8]">
              {errorMessage || "영화 정보를 불러오지 못했어요."}
            </p>
            {lookupDebugDetail && process.env.NODE_ENV === "development" ? (
              <p className="mt-3 rounded-md bg-[#12100f]/40 px-3 py-2 text-xs leading-5 text-[#e7d4c0]">
                {lookupDebugDetail}
              </p>
            ) : null}
          </Card>
        </PageContainer>
      </main>
    );
  }

  const { movie } = detail;
  const releaseText = movie.releaseYear ?? "개봉일 미상";
  const genreText = movie.genres.length > 0 ? movie.genres.join(", ") : "장르 미상";
  const runtimeText = movie.runtimeLabel ?? "상영 시간 미상";
  const ctaHref = `/impressions/new?movieId=${encodeURIComponent(movie.id)}`;

  return (
    <main className="bg-[#12100f] text-[#fff7ea]">
      <PageContainer className="py-16 sm:py-24">
        <Link
          href="/movies"
          className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-[#c9ad96] transition hover:bg-[#fff7ea]/8 hover:text-[#fff7ea] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
        >
          영화 목록으로
        </Link>

        {errorMessage ? (
          <Card className="mt-8 border-[#f4c7d8]/24 bg-[#f4c7d8]/10 p-5">
            <p className="text-sm leading-6 text-[#f4c7d8]">{errorMessage}</p>
          </Card>
        ) : null}

        {detail.isFallback ? (
          <Card className="mt-8 border-[#f0a15f]/24 bg-[#f0a15f]/10 p-5">
            <p className="text-sm leading-6 text-[#ffd3a3]">
              실제 Supabase 데이터를 찾지 못해 임시 영화 정보를 보여주고 있어요.
            </p>
          </Card>
        ) : null}

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(260px,0.44fr)_minmax(0,1fr)] lg:items-start">
          <div
            className="rounded-lg border border-[#fff7ea]/12 bg-[linear-gradient(145deg,rgba(240,161,95,0.24),rgba(244,199,216,0.13)_46%,rgba(18,16,15,0.88))] bg-cover bg-center p-4 shadow-[0_30px_90px_rgba(0,0,0,0.34)]"
            style={
              movie.posterUrl
                ? {
                    backgroundImage: `linear-gradient(180deg,rgba(18,16,15,0.08),rgba(18,16,15,0.84)),url(${movie.posterUrl})`,
                  }
                : undefined
            }
          >
            <div className="aspect-[2/3] rounded-md border border-[#fff7ea]/10 bg-[#12100f]/30 p-6 backdrop-blur-[1px]">
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm font-medium text-[#f2b482]">남은 장면</p>
                <div>
                  <p className="text-4xl font-semibold leading-tight text-[#fff7ea]">
                    {movie.title}
                  </p>
                  {movie.originalTitle ? (
                    <p className="mt-3 text-sm leading-6 text-[#e7d4c0]">
                      {movie.originalTitle}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader
              eyebrow={`${releaseText} · ${genreText} · ${runtimeText}`}
              title={movie.title}
              description={movie.overview ?? "아직 등록된 영화 소개가 없어요."}
              titleAs="h1"
            />

            {movie.originalTitle ? (
              <p className="mt-4 text-base text-[#c9ad96]">
                원제 {movie.originalTitle}
              </p>
            ) : null}

            <Card className="mt-8 bg-[#fff7ea]/9 p-6">
              <p className="text-sm font-medium text-[#f2b482]">대표 감정</p>
              <p className="mt-4 text-2xl font-semibold leading-9 text-[#fff7ea]">
                {topEmotion
                  ? `이 영화는 사람들에게 ‘${topEmotion.name}’으로 가장 많이 남았어요.`
                  : "아직 이 영화의 여운이 쌓이는 중이에요."}
              </p>
            </Card>

            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["개봉", releaseText],
                ["장르", genreText],
                ["상영 시간", runtimeText],
              ].map(([label, value]) => (
                <Card key={label} className="p-4">
                  <dt className="text-sm text-[#c9ad96]">{label}</dt>
                  <dd className="mt-2 font-semibold text-[#fff7ea]">{value}</dd>
                </Card>
              ))}
            </dl>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="booking-links">
          <Card className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 id="booking-links" className="text-xl font-semibold">
                  예매하러 가기
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
                  상영 시간과 좌석은 각 예매처에서 확인할 수 있어요.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {activeBookingLinks.map((link) => (
                  <ButtonLink
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    variant="secondary"
                  >
                    {link.provider}
                  </ButtonLink>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-16" aria-labelledby="emotion-distribution">
          <Card className="bg-[linear-gradient(145deg,rgba(240,161,95,0.14),rgba(255,247,234,0.07))] p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:items-start">
              <div>
                <p className="text-sm font-medium text-[#f2b482]">감정 분포</p>
                <h2
                  id="emotion-distribution"
                  className="mt-3 text-3xl font-semibold leading-tight text-[#fff7ea]"
                >
                  평점보다 먼저 보이는 마음의 지도
                </h2>
                <p className="mt-4 text-base leading-7 text-[#c9ad96]">
                  실제 남겨진 감상에서 고른 감정들을 모아 보여줘요.
                </p>
              </div>

              {emotionDistribution.length > 0 ? (
                <div className="space-y-5">
                  {emotionDistribution.map((emotion) => (
                    <div key={emotion.emotion.id}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <EmotionTag
                          as="span"
                          selected={emotion.emotion.id === topEmotion?.id}
                          tone={getEmotionTone(emotion.emotion.name)}
                        >
                          {getEmotionLabel(emotion.emotion)}
                        </EmotionTag>
                        <span className="text-lg font-semibold text-[#f2b482]">
                          {emotion.percent}% · {emotion.count}개
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-[#12100f]/60">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#f0a15f,#f4c7d8)]"
                          style={{ width: `${emotion.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed bg-[#fff7ea]/5 text-center">
                  <p className="text-base leading-7 text-[#e7d4c0]">
                    아직 이 영화에 남겨진 감상이 없어요. 첫 감상을 남겨보세요.
                  </p>
                </Card>
              )}
            </div>
          </Card>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.44fr)]">
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#fff7ea]">
                  사람들이 남긴 한 줄 감상
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
                  긴 글보다 먼저 남은 감정의 기록들.
                </p>
              </div>
              <ButtonLink href={ctaHref}>나도 감상 남기기</ButtonLink>
            </div>

            {detail.impressions.length > 0 ? (
              <div className="mt-8 space-y-5">
                {detail.impressions.map((impression) => {
                  const watchedDate = formatDate(impression.watchedAt);
                  const createdDate = formatDate(impression.createdAt);

                  return (
                    <article
                      key={impression.id}
                      className="rounded-lg border border-[#fff7ea]/10 bg-[#12100f]/40 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        {impression.emotions.map((emotion) => (
                          <EmotionTag
                            as="span"
                            key={emotion.id}
                            tone={getEmotionTone(emotion.name)}
                          >
                            {getEmotionLabel(emotion)}
                          </EmotionTag>
                        ))}
                        <span className="text-sm text-[#c9ad96]">
                          {watchedDate ?? createdDate ?? "날짜 미상"}
                        </span>
                        {impression.rating ? (
                          <span className="rounded-full bg-[#fff7ea]/8 px-3 py-1 text-sm text-[#e7d4c0]">
                            별점 {impression.rating}
                          </span>
                        ) : null}
                        {impression.isSpoiler ? (
                          <span className="rounded-full border border-[#f4c7d8]/24 bg-[#f4c7d8]/10 px-3 py-1 text-sm text-[#f4c7d8]">
                            스포일러 포함
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-4 text-lg leading-8 text-[#f1ddc9]">
                        “{impression.oneLine}”
                      </p>
                      {impression.note ? (
                        <p className="mt-3 text-sm leading-7 text-[#e7d4c0]">
                          {getNotePreview(impression.note)}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <Card className="mt-8 border-dashed bg-[#fff7ea]/5 text-center">
                <p className="text-base leading-7 text-[#e7d4c0]">
                  아직 이 영화에 남겨진 감상이 없어요. 첫 감상을 남겨보세요.
                </p>
              </Card>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-[#fff7ea]">
              평론가의 짧은 시선
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
              감상을 방해하지 않도록, 참고용으로만 가볍게 모아두었어요.
            </p>

            {detail.criticReviews.length > 0 ? (
              <div className="mt-6 space-y-4">
                {detail.criticReviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-lg border border-[#fff7ea]/8 bg-[#fff7ea]/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[#fff7ea]">
                          {review.criticName}
                        </h3>
                        <p className="mt-1 text-sm text-[#c9ad96]">
                          {review.outlet}
                        </p>
                      </div>
                      {review.rating ? (
                        <span className="text-sm font-medium text-[#f2b482]">
                          {review.rating}
                        </span>
                      ) : null}
                    </div>
                    {review.shortQuote ? (
                      <p className="mt-4 text-sm leading-6 text-[#e7d4c0]">
                        {review.shortQuote}
                      </p>
                    ) : null}
                    {review.sourceUrl ? (
                      <a
                        href={review.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex rounded-full px-3 py-2 text-sm font-medium text-[#f2b482] transition hover:bg-[#fff7ea]/8 focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
                      >
                        출처 보기
                      </a>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-lg border border-[#fff7ea]/8 bg-[#fff7ea]/5 p-4 text-sm leading-6 text-[#c9ad96]">
                아직 큐레이션된 평론 링크가 없어요.
              </p>
            )}
          </Card>
        </section>

        <section className="mt-16">
          <Card className="bg-[#fff7ea]/10 p-8 sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <p className="max-w-2xl text-2xl font-semibold leading-10 text-[#fff7ea]">
                이 영화가 당신에게는 어떤 감정으로 남았나요?
              </p>
              <ButtonLink href={ctaHref} className="w-full sm:w-auto">
                나도 감상 남기기
              </ButtonLink>
            </div>
          </Card>
        </section>
      </PageContainer>
    </main>
  );
}
