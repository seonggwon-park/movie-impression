"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  ButtonLink,
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import { getEmotionTone } from "@/lib/emotions";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
  upsertUserProfile,
} from "@/lib/supabase";
import { getWatchMethodLabel } from "@/lib/watch-methods";

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
  user_id: string | null;
  one_line: string;
  note: string | null;
  rating: number | null;
  is_spoiler: boolean | null;
  watched_at: string | null;
  watch_method: string | null;
  created_at: string | null;
  impression_emotions:
    | Array<{
        emotions: MaybeArray<SupabaseEmotionRow>;
      }>
    | null;
};

type SupabaseCurrentUserLikeRow = {
  impression_id: string;
};

type LikeCountsResponse = {
  counts?: Record<string, number>;
  message?: string;
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
  userId: string | null;
  oneLine: string;
  note: string | null;
  rating: string | null;
  isSpoiler: boolean;
  watchedAt: string | null;
  watchMethod: string | null;
  createdAt: string | null;
  emotions: EmotionView[];
  likeCount: number;
  likedByCurrentUser: boolean;
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
};

type MovieLookupDebug = {
  rawParam: string;
  decodedParam: string;
  attemptedUuidLookup: boolean;
  tmdbIdFallback: number | null;
};

type ReportReasonValue =
  | "offensive"
  | "sexual"
  | "violence_crime"
  | "hate_discrimination"
  | "spoiler"
  | "spam"
  | "other";

type ImpressionSortOption = "newest" | "liked" | "oldest";

const fallbackBookingLinks = [
  { id: "cgv", provider: "CGV", url: "https://www.cgv.co.kr/" },
  { id: "megabox", provider: "메가박스", url: "https://www.megabox.co.kr/" },
  {
    id: "lotte-cinema",
    provider: "롯데시네마",
    url: "https://www.lottecinema.co.kr/",
  },
] satisfies BookingLinkView[];

const reportReasons = [
  { value: "offensive", label: "불쾌한 표현" },
  { value: "sexual", label: "성적 콘텐츠" },
  { value: "violence_crime", label: "폭력/범죄 관련" },
  { value: "hate_discrimination", label: "혐오/차별 표현" },
  { value: "spoiler", label: "스포일러" },
  { value: "spam", label: "스팸/광고" },
  { value: "other", label: "기타" },
] satisfies Array<{ value: ReportReasonValue; label: string }>;

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

function getCreatedAtTime(impression: ImpressionView) {
  return impression.createdAt ? new Date(impression.createdAt).getTime() : 0;
}

function getUniqueImpressionEmotions(impressions: ImpressionView[]) {
  const emotionsById = new Map<string, EmotionView>();

  impressions.forEach((impression) => {
    impression.emotions.forEach((emotion) => {
      emotionsById.set(emotion.id, emotion);
    });
  });

  return [...emotionsById.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "ko-KR"),
  );
}

function isDuplicateReportError(error: { code?: string; message: string }) {
  return (
    error.code === "23505" ||
    error.message.includes("reports_impression_reporter_unique") ||
    error.message.toLowerCase().includes("duplicate")
  );
}

function isDuplicateLikeError(error: { code?: string; message: string }) {
  return (
    error.code === "23505" ||
    error.message.includes("impression_likes_impression_user_unique") ||
    error.message.toLowerCase().includes("duplicate")
  );
}

function addLikeStateToImpressions(
  impressions: ImpressionView[],
  likeCounts: Record<string, number>,
  currentUserLikeIds: Set<string>,
) {
  return impressions.map((impression) => ({
    ...impression,
    likeCount: likeCounts[impression.id] ?? 0,
    likedByCurrentUser: currentUserLikeIds.has(impression.id),
  }));
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
    userId: row.user_id,
    oneLine: row.one_line,
    note: row.note,
    rating: row.rating ? String(row.rating) : null,
    isSpoiler: Boolean(row.is_spoiler),
    watchedAt: row.watched_at,
    watchMethod: row.watch_method,
    createdAt: row.created_at,
    emotions,
    likeCount: 0,
    likedByCurrentUser: false,
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

function getWatchMethodStats(impressions: ImpressionView[]) {
  const counts = impressions.reduce<
    Record<string, { label: string; count: number }>
  >((current, impression) => {
    const label = getWatchMethodLabel(impression.watchMethod);

    if (!impression.watchMethod || !label) {
      return current;
    }

    return {
      ...current,
      [impression.watchMethod]: {
        label,
        count: (current[impression.watchMethod]?.count ?? 0) + 1,
      },
    };
  }, {});

  const total = Object.values(counts).reduce(
    (sum, item) => sum + item.count,
    0,
  );

  return Object.values(counts)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko-KR"))
    .map((item) => ({
      ...item,
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

async function fetchPublicLikeCounts(impressionIds: string[]) {
  if (impressionIds.length === 0) {
    return {};
  }

  const response = await fetch(
    `/api/impressions/like-counts?ids=${encodeURIComponent(
      impressionIds.join(","),
    )}`,
    { cache: "no-store" },
  );
  const data = (await response
    .json()
    .catch(() => null)) as LikeCountsResponse | null;

  if (!response.ok) {
    throw new Error(data?.message ?? "공감 수를 불러오지 못했어요.");
  }

  return data?.counts ?? {};
}

export function MovieDetail({ identifier }: MovieDetailProps) {
  const isSupabaseConfigured = hasSupabaseConfig();
  const [detail, setDetail] = useState<MovieDetailState | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [errorMessage, setErrorMessage] = useState("");
  const [lookupDebugDetail, setLookupDebugDetail] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [reportingImpression, setReportingImpression] =
    useState<ImpressionView | null>(null);
  const [reportReason, setReportReason] = useState<ReportReasonValue | "">("");
  const [reportDetail, setReportDetail] = useState("");
  const [reportErrorMessage, setReportErrorMessage] = useState("");
  const [reportSuccessMessage, setReportSuccessMessage] = useState("");
  const [reportedImpressionIds, setReportedImpressionIds] = useState<string[]>(
    [],
  );
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [likingImpressionId, setLikingImpressionId] = useState<string | null>(
    null,
  );
  const [likeErrorMessage, setLikeErrorMessage] = useState("");
  const [impressionSort, setImpressionSort] =
    useState<ImpressionSortOption>("newest");
  const [selectedImpressionEmotionId, setSelectedImpressionEmotionId] =
    useState("all");
  const [excludeSpoilers, setExcludeSpoilers] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadMovieDetail() {
      setErrorMessage("");
      setLookupDebugDetail("");

      if (!isSupabaseConfigured) {
        setCurrentUserId(null);
        setErrorMessage(
          "Supabase 환경변수가 설정되지 않아 영화 정보를 불러올 수 없어요.",
        );
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

        setErrorMessage(
          `영화 정보를 불러오지 못했어요. ${movieResult.error.message}`,
        );

        setIsLoading(false);
        return;
      }

      if (!movieResult.data) {
        console.error("Supabase movie lookup returned no data", lookupDebug);
        setErrorMessage("이 영화를 찾지 못했어요.");
        setLookupDebugDetail(formatLookupDebugDetail(lookupDebug));

        setIsLoading(false);
        return;
      }

      const movie = normalizeMovie(movieResult.data as SupabaseMovieRow);
      const supabase = getSupabaseBrowserClient();

      const [
        userResult,
        impressionsResult,
        criticReviewsResult,
        bookingLinksResult,
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("impressions")
          .select(
            `
              id,
              user_id,
              one_line,
              note,
              rating,
              is_spoiler,
              watched_at,
              watch_method,
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

      if (
        userResult.error &&
        userResult.error.name !== "AuthSessionMissingError"
      ) {
        console.error(
          "Supabase getUser failed on movie detail",
          userResult.error,
        );
      }

      const currentUser = userResult.data.user ?? null;

      setCurrentUserId(currentUser?.id ?? null);

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

      const impressions = (
        (impressionsResult.data ?? []) as SupabaseImpressionRow[]
      ).map(normalizeImpression);
      const impressionIds = impressions.map((impression) => impression.id);
      let likeCounts: Record<string, number> = {};
      let currentUserLikeIds = new Set<string>();

      if (impressionIds.length > 0) {
        try {
          likeCounts = await fetchPublicLikeCounts(impressionIds);
        } catch (error) {
          console.error("Public impression like counts load failed", error);
        }
      }

      if (!isMounted) {
        return;
      }

      if (currentUser && impressionIds.length > 0) {
        const { data: currentUserLikeRows, error: currentUserLikesError } =
          await supabase
            .from("impression_likes")
            .select("impression_id")
            .eq("user_id", currentUser.id)
            .in("impression_id", impressionIds);

        if (!isMounted) {
          return;
        }

        if (currentUserLikesError) {
          console.error(
            "Supabase current user impression likes load failed",
            currentUserLikesError,
          );
        } else {
          currentUserLikeIds = new Set(
            ((currentUserLikeRows ?? []) as SupabaseCurrentUserLikeRow[]).map(
              (like) => like.impression_id,
            ),
          );
        }
      }

      const impressionsWithLikes = addLikeStateToImpressions(
        impressions,
        likeCounts,
        currentUserLikeIds,
      );

      const bookingLinks = (
        (bookingLinksResult.data ?? []) as SupabaseBookingLinkRow[]
      ).map(normalizeBookingLink);

      setDetail({
        movie,
        impressions: impressionsWithLikes,
        criticReviews: (
          (criticReviewsResult.data ?? []) as SupabaseCriticReviewRow[]
        ).map(normalizeCriticReview),
        bookingLinks:
          bookingLinks.length > 0 ? bookingLinks : fallbackBookingLinks,
      });
      setIsLoading(false);
    }

    loadMovieDetail();

    return () => {
      isMounted = false;
    };
  }, [identifier, isSupabaseConfigured]);

  function openReportForm(impression: ImpressionView) {
    setReportSuccessMessage("");
    setReportErrorMessage("");

    if (!isSupabaseConfigured) {
      setReportErrorMessage(
        "Supabase 환경변수가 설정되지 않아 신고를 보낼 수 없어요.",
      );
      return;
    }

    if (!currentUserId) {
      setReportErrorMessage("로그인 후 신고할 수 있어요.");
      return;
    }

    if (impression.userId === currentUserId) {
      return;
    }

    setReportingImpression(impression);
    setReportReason("");
    setReportDetail("");
  }

  function closeReportForm() {
    setReportingImpression(null);
    setReportReason("");
    setReportDetail("");
    setReportErrorMessage("");
  }

  async function handleSubmitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reportingImpression) {
      return;
    }

    if (!reportReason) {
      setReportErrorMessage("신고 사유를 선택해주세요.");
      return;
    }

    if (!isSupabaseConfigured) {
      setReportErrorMessage(
        "Supabase 환경변수가 설정되지 않아 신고를 보낼 수 없어요.",
      );
      return;
    }

    setIsSubmittingReport(true);
    setReportErrorMessage("");
    setReportSuccessMessage("");

    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Supabase getUser failed before report insert", userError);
    }

    if (!userData.user) {
      setCurrentUserId(null);
      setReportErrorMessage("로그인 후 신고할 수 있어요.");
      setIsSubmittingReport(false);
      return;
    }

    setCurrentUserId(userData.user.id);

    const { error: profileError } = await upsertUserProfile(
      supabase,
      userData.user,
    );

    if (profileError) {
      console.error(
        "Supabase profile upsert failed before report",
        profileError,
      );
      setReportErrorMessage(
        `신고를 보내기 전에 프로필을 준비하지 못했어요. ${profileError.message}`,
      );
      setIsSubmittingReport(false);
      return;
    }

    const trimmedDetail = reportDetail.trim();
    const { error } = await supabase.from("reports").insert({
      impression_id: reportingImpression.id,
      reporter_id: userData.user.id,
      reason: reportReason,
      detail: trimmedDetail || null,
      status: "pending",
    });

    if (error) {
      console.error("Supabase report insert failed", error);
      setReportErrorMessage(
        isDuplicateReportError(error)
          ? "이미 신고한 감상이에요."
          : `신고를 보내지 못했어요. ${error.message}`,
      );
      setIsSubmittingReport(false);
      return;
    }

    setReportedImpressionIds((current) =>
      current.includes(reportingImpression.id)
        ? current
        : [...current, reportingImpression.id],
    );
    setReportSuccessMessage(
      "신고가 접수됐어요. 확인 후 필요한 조치를 할게요.",
    );
    setReportingImpression(null);
    setReportReason("");
    setReportDetail("");
    setIsSubmittingReport(false);
  }

  function updateImpressionLikeState(
    impressionId: string,
    likedByCurrentUser: boolean,
    likeCountDelta: number,
  ) {
    setDetail((currentDetail) => {
      if (!currentDetail) {
        return currentDetail;
      }

      return {
        ...currentDetail,
        impressions: currentDetail.impressions.map((impression) => {
          if (impression.id !== impressionId) {
            return impression;
          }

          if (
            impression.likedByCurrentUser === likedByCurrentUser &&
            likeCountDelta === 0
          ) {
            return impression;
          }

          return {
            ...impression,
            likedByCurrentUser,
            likeCount: Math.max(0, impression.likeCount + likeCountDelta),
          };
        }),
      };
    });
  }

  async function handleToggleLike(impression: ImpressionView) {
    if (likingImpressionId) {
      return;
    }

    setLikeErrorMessage("");

    if (!isSupabaseConfigured) {
      setLikeErrorMessage("공감을 저장하는 중 문제가 생겼어요.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Supabase getUser failed before impression like", userError);
    }

    if (!userData.user) {
      setCurrentUserId(null);
      setLikeErrorMessage("로그인 후 공감할 수 있어요.");
      return;
    }

    if (impression.userId === userData.user.id) {
      return;
    }

    setCurrentUserId(userData.user.id);
    setLikingImpressionId(impression.id);

    if (impression.likedByCurrentUser) {
      const { error } = await supabase
        .from("impression_likes")
        .delete()
        .eq("impression_id", impression.id)
        .eq("user_id", userData.user.id);

      setLikingImpressionId(null);

      if (error) {
        console.error("Supabase impression like delete failed", error);
        setLikeErrorMessage("공감을 취소하는 중 문제가 생겼어요.");
        return;
      }

      updateImpressionLikeState(impression.id, false, -1);
      return;
    }

    const { error: profileError } = await upsertUserProfile(
      supabase,
      userData.user,
    );

    if (profileError) {
      console.error(
        "Supabase profile upsert failed before impression like",
        profileError,
      );
      setLikeErrorMessage(
        `공감을 저장하는 중 문제가 생겼어요. ${profileError.message}`,
      );
      setLikingImpressionId(null);
      return;
    }

    const { error } = await supabase.from("impression_likes").insert({
      impression_id: impression.id,
      user_id: userData.user.id,
    });

    setLikingImpressionId(null);

    if (error) {
      console.error("Supabase impression like insert failed", error);

      if (isDuplicateLikeError(error)) {
        updateImpressionLikeState(impression.id, true, 0);
        return;
      }

      setLikeErrorMessage("공감을 저장하는 중 문제가 생겼어요.");
      return;
    }

    updateImpressionLikeState(impression.id, true, 1);
  }

  const emotionDistribution = useMemo(
    () => getEmotionDistribution(detail?.impressions ?? []),
    [detail?.impressions],
  );
  const watchMethodStats = useMemo(
    () => getWatchMethodStats(detail?.impressions ?? []),
    [detail?.impressions],
  );
  const impressionEmotionFilters = useMemo(
    () => getUniqueImpressionEmotions(detail?.impressions ?? []),
    [detail?.impressions],
  );
  const visibleImpressions = useMemo(() => {
    const selectedEmotionId =
      selectedImpressionEmotionId === "all"
        ? null
        : selectedImpressionEmotionId;
    const filteredImpressions = (detail?.impressions ?? [])
      .filter((impression) =>
        selectedEmotionId
          ? impression.emotions.some((emotion) => emotion.id === selectedEmotionId)
          : true,
      )
      .filter((impression) =>
        excludeSpoilers ? !impression.isSpoiler : true,
      );

    return [...filteredImpressions].sort((a, b) => {
      if (impressionSort === "liked") {
        return (
          b.likeCount - a.likeCount ||
          getCreatedAtTime(b) - getCreatedAtTime(a)
        );
      }

      if (impressionSort === "oldest") {
        return getCreatedAtTime(a) - getCreatedAtTime(b);
      }

      return getCreatedAtTime(b) - getCreatedAtTime(a);
    });
  }, [
    detail?.impressions,
    excludeSpoilers,
    impressionSort,
    selectedImpressionEmotionId,
  ]);
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

        <section className="mt-8" aria-labelledby="watch-method-stats">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-[#f2b482]">시청 방법</p>
              <h2
                id="watch-method-stats"
                className="text-2xl font-semibold text-[#fff7ea]"
              >
                사람들은 이렇게 봤어요
              </h2>
              <p className="text-sm leading-6 text-[#c9ad96]">
                감상을 남긴 사람들이 선택한 시청 방법이에요.
              </p>
            </div>

            {watchMethodStats.length > 0 ? (
              <div className="mt-6 space-y-4">
                {watchMethodStats.map((method) => (
                  <div key={method.label}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span className="font-semibold text-[#fff7ea]">
                        {method.label}
                      </span>
                      <span className="text-sm font-medium text-[#f2b482]">
                        {method.count.toLocaleString("ko-KR")}명 ·{" "}
                        {method.percent}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[#12100f]/60">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#f0a15f,#ffd3a3)]"
                        style={{ width: `${method.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-lg border border-dashed border-[#fff7ea]/12 bg-[#fff7ea]/5 p-4 text-sm leading-6 text-[#c9ad96]">
                아직 시청 방법 통계가 없어요.
              </p>
            )}
          </Card>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.44fr)]">
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#fff7ea]">
                  사람들의 감상
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
                  긴 글보다 먼저 남은 감정의 기록들.
                </p>
              </div>
              <ButtonLink href={ctaHref}>나도 감상 남기기</ButtonLink>
            </div>

            {reportSuccessMessage ? (
              <p className="mt-6 rounded-lg border border-[#f0a15f]/24 bg-[#f0a15f]/10 px-4 py-3 text-sm leading-6 text-[#ffd3a3]">
                {reportSuccessMessage}
              </p>
            ) : null}

            {reportErrorMessage && !reportingImpression ? (
              <p className="mt-6 rounded-lg border border-[#f4c7d8]/24 bg-[#f4c7d8]/10 px-4 py-3 text-sm leading-6 text-[#f4c7d8]">
                {reportErrorMessage}
              </p>
            ) : null}

            {likeErrorMessage ? (
              <p className="mt-6 rounded-lg border border-[#f4c7d8]/24 bg-[#f4c7d8]/10 px-4 py-3 text-sm leading-6 text-[#f4c7d8]">
                {likeErrorMessage}
              </p>
            ) : null}

            {detail.impressions.length > 0 ? (
              <div className="mt-6 rounded-lg border border-[#fff7ea]/10 bg-[#fff7ea]/5 p-4">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                  <label className="block">
                    <span className="text-xs font-medium text-[#f2b482]">
                      정렬
                    </span>
                    <select
                      value={impressionSort}
                      onChange={(event) =>
                        setImpressionSort(
                          event.target.value as ImpressionSortOption,
                        )
                      }
                      className="mt-2 w-full rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 text-sm font-medium text-[#fff7ea] outline-none transition focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
                    >
                      <option value="newest">최신순</option>
                      <option value="liked">공감순</option>
                      <option value="oldest">오래된순</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-[#f2b482]">
                      감정
                    </span>
                    <select
                      value={selectedImpressionEmotionId}
                      onChange={(event) =>
                        setSelectedImpressionEmotionId(event.target.value)
                      }
                      className="mt-2 w-full rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 text-sm font-medium text-[#fff7ea] outline-none transition focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
                    >
                      <option value="all">전체 감정</option>
                      {impressionEmotionFilters.map((emotion) => (
                        <option key={emotion.id} value={emotion.id}>
                          {getEmotionLabel(emotion)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    aria-pressed={excludeSpoilers}
                    onClick={() =>
                      setExcludeSpoilers((currentValue) => !currentValue)
                    }
                    className={`rounded-lg border px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f] ${
                      excludeSpoilers
                        ? "border-[#f0a15f]/55 bg-[#f0a15f]/20 text-[#ffd3a3]"
                        : "border-[#fff7ea]/12 bg-[#12100f] text-[#e7d4c0] hover:border-[#f0a15f]/35 hover:text-[#ffd3a3]"
                    }`}
                  >
                    스포일러 제외
                  </button>
                </div>
              </div>
            ) : null}

            {detail.impressions.length > 0 ? (
              visibleImpressions.length > 0 ? (
              <div className="mt-6 space-y-5">
                {visibleImpressions.map((impression) => {
                  const watchedDate = formatDate(impression.watchedAt);
                  const createdDate = formatDate(impression.createdAt);
                  const watchMethodLabel = getWatchMethodLabel(
                    impression.watchMethod,
                  );
                  const isOwnImpression = currentUserId
                    ? impression.userId === currentUserId
                    : false;
                  const canReport = !isOwnImpression;
                  const canLike = !isOwnImpression;
                  const isLiking = likingImpressionId === impression.id;
                  const isReported = reportedImpressionIds.includes(
                    impression.id,
                  );

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
                        {watchMethodLabel ? (
                          <span className="rounded-full bg-[#fff7ea]/8 px-3 py-1 text-sm text-[#e7d4c0]">
                            시청 방법: {watchMethodLabel}
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

                      {canLike || impression.likeCount > 0 || canReport ? (
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-h-9 items-center">
                            {canLike ? (
                              <button
                                type="button"
                                aria-pressed={impression.likedByCurrentUser}
                                disabled={isLiking}
                                onClick={() => handleToggleLike(impression)}
                                className={`rounded-full border px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f] disabled:cursor-not-allowed disabled:opacity-60 ${
                                  impression.likedByCurrentUser
                                    ? "border-[#f0a15f]/55 bg-[#f0a15f]/18 text-[#ffd3a3]"
                                    : "border-[#fff7ea]/14 bg-[#fff7ea]/5 text-[#e7d4c0] hover:border-[#f0a15f]/45 hover:text-[#ffd3a3]"
                                }`}
                              >
                                {impression.likedByCurrentUser
                                  ? "공감했어요"
                                  : "공감"}{" "}
                                {impression.likeCount.toLocaleString("ko-KR")}
                              </button>
                            ) : impression.likeCount > 0 ? (
                              <span className="rounded-full border border-[#fff7ea]/12 bg-[#fff7ea]/5 px-3 py-2 text-xs font-medium text-[#c9ad96]">
                                공감{" "}
                                {impression.likeCount.toLocaleString("ko-KR")}
                              </span>
                            ) : null}
                          </div>

                          {canReport ? (
                            <button
                              type="button"
                              disabled={isReported}
                              onClick={() => openReportForm(impression)}
                              className="rounded-full px-3 py-2 text-xs font-medium text-[#c9ad96] transition hover:bg-[#fff7ea]/8 hover:text-[#fff7ea] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isReported ? "신고 완료" : "신고"}
                            </button>
                          ) : null}
                        </div>
                      ) : null}

                      {reportingImpression?.id === impression.id ? (
                        <form
                          className="mt-5 rounded-lg border border-[#fff7ea]/10 bg-[#fff7ea]/5 p-4"
                          onSubmit={handleSubmitReport}
                        >
                          <p className="text-sm font-medium text-[#f2b482]">
                            이 감상을 신고할까요?
                          </p>
                          <label
                            className="mt-4 block text-sm font-medium text-[#e7d4c0]"
                            htmlFor={`report-reason-${impression.id}`}
                          >
                            신고 사유
                          </label>
                          <select
                            id={`report-reason-${impression.id}`}
                            value={reportReason}
                            onChange={(event) =>
                              setReportReason(
                                event.target.value as ReportReasonValue | "",
                              )
                            }
                            className="mt-2 w-full rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 text-[#fff7ea] outline-none transition focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
                          >
                            <option value="">사유를 선택해주세요</option>
                            {reportReasons.map((reason) => (
                              <option key={reason.value} value={reason.value}>
                                {reason.label}
                              </option>
                            ))}
                          </select>

                          <label
                            className="mt-4 block text-sm font-medium text-[#e7d4c0]"
                            htmlFor={`report-detail-${impression.id}`}
                          >
                            더 남기고 싶은 설명
                          </label>
                          <textarea
                            id={`report-detail-${impression.id}`}
                            value={reportDetail}
                            onChange={(event) =>
                              setReportDetail(event.target.value)
                            }
                            placeholder="조금 더 설명하고 싶다면 적어주세요."
                            rows={3}
                            className="mt-2 w-full resize-none rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 leading-7 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
                          />

                          {reportErrorMessage ? (
                            <p className="mt-3 rounded-lg border border-[#f4c7d8]/24 bg-[#f4c7d8]/10 px-4 py-3 text-sm leading-6 text-[#f4c7d8]">
                              {reportErrorMessage}
                            </p>
                          ) : null}

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              onClick={closeReportForm}
                              className="rounded-full border border-[#fff7ea]/14 px-4 py-2 text-sm font-medium text-[#e7d4c0] transition hover:bg-[#fff7ea]/8 hover:text-[#fff7ea] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
                            >
                              취소
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmittingReport}
                              className="rounded-full border border-[#f0a15f]/35 bg-[#f0a15f]/12 px-4 py-2 text-sm font-semibold text-[#ffd3a3] transition hover:border-[#f0a15f]/55 hover:bg-[#f0a15f]/20 focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isSubmittingReport ? "보내는 중" : "신고 보내기"}
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </article>
                  );
                })}
              </div>
              ) : (
                <Card className="mt-6 border-dashed bg-[#fff7ea]/5 text-center">
                  <p className="text-base font-semibold leading-7 text-[#fff7ea]">
                    조건에 맞는 감상이 없어요.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
                    필터를 바꿔 다시 둘러보세요.
                  </p>
                </Card>
              )
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
