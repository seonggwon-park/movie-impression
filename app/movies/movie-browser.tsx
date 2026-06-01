"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ButtonLink, Card, EmotionTag } from "@/components/ui";
import {
  emotionOptions,
  getEmotionTone,
  type EmotionOption,
} from "@/lib/emotions";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase";

type MaybeArray<T> = T | T[] | null;

type SupabaseMovieRow = {
  id: string;
  title: string;
  slug: string | null;
  overview: string | null;
  poster_url: string | null;
  release_date: string | null;
  genres: string[] | null;
  created_at: string | null;
};

type SupabaseEmotionRow = {
  id: string;
  name: string;
  emoji: string | null;
};

type SupabaseImpressionRow = {
  movie_id: string;
  impression_emotions:
    | Array<{
        emotions: MaybeArray<SupabaseEmotionRow>;
      }>
    | null;
};

type EmotionView = {
  id: string;
  name: string;
  emoji: string | null;
};

type EmotionFilterView = {
  name: string;
  emoji: string | null;
};

type MovieView = {
  id: string;
  title: string;
  slug: string | null;
  overview: string | null;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: string | null;
  genres: string[];
  createdAt: string | null;
  impressionCount: number;
  mainEmotion: EmotionView | null;
  emotionNames: string[];
  emotionVariety: number;
};

const emotionOrder = new Map(
  emotionOptions.map((emotion: EmotionOption, index) => [
    emotion.label,
    index,
  ]),
);

function getSingleRelation<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getReleaseYear(value: string | null) {
  return value ? value.slice(0, 4) : null;
}

function getMovieHref(movie: MovieView) {
  return `/movies/${movie.slug || movie.id}`;
}

function getOverviewPreview(overview: string | null) {
  if (!overview) {
    return "아직 등록된 영화 소개가 없어요.";
  }

  return overview.length > 120 ? `${overview.slice(0, 120)}...` : overview;
}

function getEmotionLabel(emotion: EmotionView) {
  return emotion.emoji ? `${emotion.emoji} ${emotion.name}` : emotion.name;
}

function getEmotionFilterLabel(emotion: EmotionFilterView) {
  return emotion.emoji ? `${emotion.emoji} ${emotion.name}` : emotion.name;
}

function sortEmotionFilters(emotions: EmotionFilterView[]) {
  return [...emotions].sort((a, b) => {
    const aOrder = emotionOrder.get(a.name) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = emotionOrder.get(b.name) ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return a.name.localeCompare(b.name, "ko-KR");
  });
}

function createFallbackEmotionFilters() {
  return emotionOptions.map((emotion) => ({
    name: emotion.label,
    emoji: null,
  }));
}

function parseSelectedEmotionNames(
  rawEmotionValue: string,
  availableEmotionNames: Set<string>,
) {
  if (!rawEmotionValue) {
    return [];
  }

  return rawEmotionValue
    .split(",")
    .map((emotionName) => emotionName.trim())
    .filter((emotionName, index, emotionNames) => {
      return (
        availableEmotionNames.has(emotionName) &&
        emotionNames.indexOf(emotionName) === index
      );
    });
}

function movieHasEveryEmotion(
  movie: MovieView,
  selectedEmotionNames: string[],
) {
  const movieEmotionNames = new Set(movie.emotionNames);

  return selectedEmotionNames.every((emotionName) =>
    movieEmotionNames.has(emotionName),
  );
}

function createMovieViews(
  movies: SupabaseMovieRow[],
  impressions: SupabaseImpressionRow[],
) {
  const statsByMovieId = new Map<
    string,
    {
      impressionCount: number;
      emotionCounts: Map<string, { emotion: EmotionView; count: number }>;
    }
  >();

  impressions.forEach((impression) => {
    const stats = statsByMovieId.get(impression.movie_id) ?? {
      impressionCount: 0,
      emotionCounts: new Map<string, { emotion: EmotionView; count: number }>(),
    };

    stats.impressionCount += 1;

    impression.impression_emotions?.forEach((item) => {
      const emotion = getSingleRelation(item.emotions);

      if (!emotion) {
        return;
      }

      const current = stats.emotionCounts.get(emotion.name);
      stats.emotionCounts.set(emotion.name, {
        emotion,
        count: (current?.count ?? 0) + 1,
      });
    });

    statsByMovieId.set(impression.movie_id, stats);
  });

  return movies.map((movie) => {
    const stats = statsByMovieId.get(movie.id);
    const emotionNames = [...(stats?.emotionCounts.keys() ?? [])];
    const mainEmotion =
      [...(stats?.emotionCounts.values() ?? [])].sort(
        (a, b) => b.count - a.count,
      )[0]?.emotion ?? null;

    return {
      id: movie.id,
      title: movie.title,
      slug: movie.slug,
      overview: movie.overview,
      posterUrl: movie.poster_url,
      releaseDate: movie.release_date,
      releaseYear: getReleaseYear(movie.release_date),
      genres: movie.genres ?? [],
      createdAt: movie.created_at,
      impressionCount: stats?.impressionCount ?? 0,
      mainEmotion,
      emotionNames,
      emotionVariety: stats?.emotionCounts.size ?? 0,
    };
  });
}

function sortByCreatedAt(movies: MovieView[]) {
  return [...movies].sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    return bTime - aTime;
  });
}

function MovieCard({
  movie,
  showMainEmotion,
}: {
  movie: MovieView;
  showMainEmotion: boolean;
}) {
  const releaseYear = movie.releaseYear ?? "개봉 연도 미상";
  const genreText = movie.genres[0] ?? "장르 미상";
  const href = getMovieHref(movie);

  return (
    <Link
      href={href}
      aria-label={`${movie.title} 상세 페이지 보기`}
      className="group block h-full rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
    >
      <Card className="flex h-full flex-col overflow-hidden p-0 transition group-hover:border-[#f0a15f]/35 group-hover:bg-[#fff7ea]/10">
        <div
          className="aspect-[16/10] border-b border-[#fff7ea]/10 bg-[linear-gradient(135deg,rgba(240,161,95,0.22),rgba(244,199,216,0.12)_42%,rgba(200,182,255,0.08)_68%,rgba(18,16,15,0.86))] bg-cover bg-center p-5"
          style={
            movie.posterUrl
              ? {
                  backgroundImage: `linear-gradient(180deg,rgba(18,16,15,0.08),rgba(18,16,15,0.84)),url(${movie.posterUrl})`,
                }
              : undefined
          }
        >
          <div className="flex h-full flex-col justify-between rounded-md border border-[#fff7ea]/10 bg-[#12100f]/34 p-4 backdrop-blur-[1px]">
            <p className="text-xs font-medium text-[#f2b482]">남은 장면</p>
            <div>
              <p className="text-2xl font-semibold text-[#fff7ea]">
                {movie.title}
              </p>
              <p className="mt-1 text-sm text-[#e7d4c0]">{releaseYear}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold text-[#fff7ea]">
                {movie.title}
              </h3>
              <p className="mt-1 text-sm text-[#c9ad96]">
                {releaseYear} · {genreText}
              </p>
            </div>
            {showMainEmotion && movie.mainEmotion ? (
              <EmotionTag
                as="span"
                tone={getEmotionTone(movie.mainEmotion.name)}
              >
                {getEmotionLabel(movie.mainEmotion)}
              </EmotionTag>
            ) : showMainEmotion ? (
              <EmotionTag as="span" tone="warm">
                감상 대기
              </EmotionTag>
            ) : null}
          </div>

          <p className="mt-6 flex-1 text-base leading-7 text-[#e7d4c0]">
            {getOverviewPreview(movie.overview)}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-[#f2b482]">
              감상 {movie.impressionCount.toLocaleString("ko-KR")}개
            </span>
            <span className="inline-flex w-fit items-center justify-center rounded-full border border-[#fff7ea]/16 px-4 py-2 text-sm font-semibold text-[#e7d4c0] transition group-hover:border-[#f0a15f]/35 group-hover:bg-[#f0a15f]/12 group-hover:text-[#ffd3a3]">
              자세히 보기
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function MovieBrowser() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSupabaseConfigured = hasSupabaseConfig();
  const [movies, setMovies] = useState<MovieView[]>([]);
  const [emotions, setEmotions] = useState<EmotionFilterView[]>([]);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [errorMessage, setErrorMessage] = useState(
    isSupabaseConfigured
      ? ""
      : "Supabase 환경변수가 설정되지 않아 저장된 영화 목록을 불러올 수 없어요.",
  );
  const emotionFilters = useMemo(
    () =>
      sortEmotionFilters(
        emotions.length > 0 ? emotions : createFallbackEmotionFilters(),
      ),
    [emotions],
  );
  const availableEmotionNames = useMemo(
    () => new Set(emotionFilters.map((emotion) => emotion.name)),
    [emotionFilters],
  );
  const requestedEmotionValue =
    searchParams.get("emotions") ?? searchParams.get("emotion") ?? "";
  const selectedEmotionNames = useMemo(
    () => parseSelectedEmotionNames(requestedEmotionValue, availableEmotionNames),
    [availableEmotionNames, requestedEmotionValue],
  );
  const selectedEmotionNameSet = useMemo(
    () => new Set(selectedEmotionNames),
    [selectedEmotionNames],
  );
  const hasSelectedEmotionFilters = selectedEmotionNames.length > 0;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    async function loadMovies() {
      const [moviesResult, impressionsResult, emotionsResult] =
        await Promise.all([
          supabase
            .from("movies")
            .select(
              "id, title, slug, overview, poster_url, release_date, genres, created_at",
            )
            .order("created_at", { ascending: false }),
          supabase.from("impressions").select(`
          movie_id,
          impression_emotions (
            emotions (
              id,
              name,
              emoji
            )
          )
        `),
          supabase.from("emotions").select("id, name, emoji").order("name"),
        ]);

      if (!isMounted) {
        return;
      }

      if (moviesResult.error) {
        console.error("Supabase movies browse load failed", moviesResult.error);
        setErrorMessage(
          `영화 목록을 불러오지 못했어요. ${moviesResult.error.message}`,
        );
        setIsLoading(false);
        return;
      }

      if (impressionsResult.error) {
        console.error(
          "Supabase movie impression stats load failed",
          impressionsResult.error,
        );
      }

      if (emotionsResult.error) {
        console.error(
          "Supabase emotions filter load failed",
          emotionsResult.error,
        );
      }

      setMovies(
        createMovieViews(
          (moviesResult.data ?? []) as SupabaseMovieRow[],
          (impressionsResult.data ?? []) as SupabaseImpressionRow[],
        ),
      );
      setEmotions(
        sortEmotionFilters(
          ((emotionsResult.data ?? []) as SupabaseEmotionRow[]).map(
            (emotion) => ({
              name: emotion.name,
              emoji: emotion.emoji,
            }),
          ),
        ),
      );
      setIsLoading(false);
    }

    loadMovies();

    return () => {
      isMounted = false;
    };
  }, [isSupabaseConfigured]);

  function handleSelectEmotion(emotionName: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("emotion");

    if (!emotionName) {
      params.delete("emotions");
    } else {
      const nextEmotionNames = selectedEmotionNameSet.has(emotionName)
        ? selectedEmotionNames.filter((name) => name !== emotionName)
        : [...selectedEmotionNames, emotionName];

      if (nextEmotionNames.length > 0) {
        params.set("emotions", nextEmotionNames.join(","));
      } else {
        params.delete("emotions");
      }
    }

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  const rankingGroups = useMemo(() => {
    const browsedMovies = hasSelectedEmotionFilters
      ? movies.filter((movie) =>
          movieHasEveryEmotion(movie, selectedEmotionNames),
        )
      : movies;
    const recentlyAdded = sortByCreatedAt(browsedMovies);
    const mostImpressed = [...browsedMovies].sort(
      (a, b) => b.impressionCount - a.impressionCount,
    );
    const mostVaried = [...browsedMovies].sort(
      (a, b) =>
        b.emotionVariety - a.emotionVariety ||
        b.impressionCount - a.impressionCount,
    );

    return [
      {
        title: "최근 추가된 영화",
        description: "여운에 실제로 등록된 영화",
        movies: recentlyAdded,
      },
      {
        title: "감상 많이 남긴 영화",
        description: "한 줄 감상이 가장 많이 쌓인 영화",
        movies: mostImpressed,
      },
      {
        title: "감정이 다양하게 남은 영화",
        description: "서로 다른 마음으로 기억된 영화",
        movies: mostVaried,
      },
    ];
  }, [hasSelectedEmotionFilters, movies, selectedEmotionNames]);

  const filteredMovies = useMemo(
    () =>
      hasSelectedEmotionFilters
        ? movies.filter((movie) =>
            movieHasEveryEmotion(movie, selectedEmotionNames),
          )
        : movies,
    [hasSelectedEmotionFilters, movies, selectedEmotionNames],
  );

  const movieCountsByEmotion = useMemo(() => {
    const counts = new Map<string, number>();

    emotionFilters.forEach((emotion) => {
      counts.set(
        emotion.name,
        movies.filter((movie) => movie.emotionNames.includes(emotion.name))
          .length,
      );
    });

    return counts;
  }, [emotionFilters, movies]);

  if (isLoading) {
    return (
      <Card className="mt-12 p-6">
        <p className="text-sm font-medium text-[#f2b482]">
          영화 목록을 불러오는 중
        </p>
        <p className="mt-3 text-xl font-semibold leading-8 text-[#fff7ea]">
          사람들이 남긴 여운을 조용히 정리하고 있어요.
        </p>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card className="mt-12 border-[#f4c7d8]/24 bg-[#f4c7d8]/10 p-6">
        <p className="text-sm font-medium text-[#f4c7d8]">불러오기 오류</p>
        <p className="mt-3 text-base leading-7 text-[#f4c7d8]">
          {errorMessage}
        </p>
      </Card>
    );
  }

  if (movies.length === 0) {
    return (
      <Card className="mt-12 border-dashed bg-[#fff7ea]/5 p-8 text-center">
        <p className="text-2xl font-semibold text-[#fff7ea]">
          아직 등록된 영화가 없어요.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#c9ad96]">
          영화 제목을 검색해 첫 영화를 추가해보세요.
        </p>
      </Card>
    );
  }

  return (
    <>
      <section className="mt-12" aria-labelledby="movie-filters">
        <h2 id="movie-filters" className="text-sm font-medium text-[#f2b482]">
          감정으로 둘러보기
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <EmotionTag
            selected={!hasSelectedEmotionFilters}
            tone="warm"
            onClick={() => handleSelectEmotion(null)}
          >
            전체 {movies.length.toLocaleString("ko-KR")}
          </EmotionTag>
          {emotionFilters.map((emotion) => (
            <EmotionTag
              key={emotion.name}
              selected={selectedEmotionNameSet.has(emotion.name)}
              tone={getEmotionTone(emotion.name)}
              onClick={() => handleSelectEmotion(emotion.name)}
            >
              {getEmotionFilterLabel(emotion)}{" "}
              {(movieCountsByEmotion.get(emotion.name) ?? 0).toLocaleString(
                "ko-KR",
              )}
            </EmotionTag>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-[#c9ad96]">
          감정을 여러 개 고르면 모두 해당하는 영화만 보여드려요.
        </p>
      </section>

      {filteredMovies.length === 0 ? (
        <Card className="mt-12 border-dashed bg-[#fff7ea]/5 p-8 text-center">
          <p className="text-2xl font-semibold text-[#fff7ea]">
            {selectedEmotionNames.length > 1
              ? "선택한 감정을 모두 가진 영화가 아직 없어요."
              : "아직 이 감정으로 남겨진 영화가 없어요."}
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#c9ad96]">
            {selectedEmotionNames.length > 1
              ? "감정을 하나 줄이거나, 첫 감상을 남겨보세요."
              : "다른 감정을 골라보거나, 첫 감상을 남겨보세요."}
          </p>
          <ButtonLink href="/impressions/new" className="mt-7">
            첫 감상 남기기
          </ButtonLink>
        </Card>
      ) : (
        <>
          <section className="mt-14 grid gap-4 lg:grid-cols-3">
            {rankingGroups.map((group) => (
              <Card key={group.title} className="p-5">
                <h2 className="text-lg font-semibold text-[#fff7ea]">
                  {group.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
                  {group.description}
                </p>
                <ol className="mt-5 space-y-3">
                  {group.movies.slice(0, 3).map((movie, index) => (
                    <li key={`${group.title}-${movie.id}`}>
                      <Link
                        href={getMovieHref(movie)}
                        aria-label={`${movie.title} 상세 페이지 보기`}
                        className="group flex items-center justify-between gap-4 rounded-lg border border-[#fff7ea]/8 bg-[#12100f]/38 px-4 py-3 transition hover:border-[#f0a15f]/28 hover:bg-[#fff7ea]/8 focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#fff7ea] group-hover:text-[#ffd3a3]">
                            {index + 1}. {movie.title}
                          </p>
                          <p className="mt-1 text-sm text-[#c9ad96]">
                            감상{" "}
                            {movie.impressionCount.toLocaleString("ko-KR")}개
                          </p>
                        </div>
                        {!hasSelectedEmotionFilters && movie.mainEmotion ? (
                          <EmotionTag
                            as="span"
                            tone={getEmotionTone(movie.mainEmotion.name)}
                          >
                            {getEmotionLabel(movie.mainEmotion)}
                          </EmotionTag>
                        ) : !hasSelectedEmotionFilters ? (
                          <EmotionTag as="span" tone="warm">
                            대기
                          </EmotionTag>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ol>
              </Card>
            ))}
          </section>

          <section className="mt-16" aria-labelledby="movie-list">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="movie-list"
                  className="text-2xl font-semibold text-[#fff7ea]"
                >
                  등록된 영화
                </h2>
                <p className="mt-2 text-sm text-[#c9ad96]">
                  검색으로 추가된 영화와 실제 남겨진 감상을 함께 보여줘요.
                </p>
              </div>
              <p className="text-sm font-medium text-[#f2b482]">
                {filteredMovies.length.toLocaleString("ko-KR")}편
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  showMainEmotion={!hasSelectedEmotionFilters}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </>
  );
}
