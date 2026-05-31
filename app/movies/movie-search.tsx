"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button, Card } from "@/components/ui";

type TmdbSearchResult = {
  tmdb_id: number;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_url: string | null;
  release_date: string | null;
  genres: string[];
};

type MovieUpsertResult = {
  movie?: {
    id: string;
    slug: string | null;
    title?: string;
    tmdb_id?: number;
  };
  message?: string;
  detail?: string;
};

function getReleaseYear(releaseDate: string | null) {
  return releaseDate?.slice(0, 4) || "개봉 연도 미정";
}

function getOverviewPreview(overview: string | null) {
  if (!overview) {
    return "아직 줄거리 소개가 준비되지 않았어요.";
  }

  return overview.length > 120 ? `${overview.slice(0, 120)}...` : overview;
}

export function MovieSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [savingTmdbId, setSavingTmdbId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    setErrorMessage(null);

    if (!trimmedQuery) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/tmdb/search?q=${encodeURIComponent(trimmedQuery)}`,
      );
      const data = (await response.json()) as {
        results?: TmdbSearchResult[];
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "영화를 검색하는 중 문제가 생겼어요.");
      }

      setResults(data.results ?? []);
    } catch (error) {
      console.error("TMDb search request failed", error);
      setResults([]);
      setErrorMessage("영화를 검색하는 중 문제가 생겼어요.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectMovie(movie: TmdbSearchResult) {
    setSavingTmdbId(movie.tmdb_id);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/movies/upsert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tmdb_id: movie.tmdb_id }),
      });
      const data = (await response.json()) as MovieUpsertResult;

      if (!response.ok || !data.movie?.id) {
        console.error("Movie upsert response failed", {
          status: response.status,
          payload: data,
        });

        const readableError =
          data.message && data.detail
            ? `${data.message} ${data.detail}`
            : data.message ||
              data.detail ||
              "영화 정보를 저장하는 중 문제가 생겼어요.";

        throw new Error(readableError);
      }

      router.push(`/movies/${data.movie.slug || data.movie.id}`);
    } catch (error) {
      console.error("Movie upsert request failed", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "영화 정보를 저장하는 중 문제가 생겼어요.",
      );
    } finally {
      setSavingTmdbId(null);
    }
  }

  return (
    <section className="mt-12" aria-labelledby="movie-search">
      <Card className="bg-[linear-gradient(145deg,rgba(255,247,234,0.08),rgba(240,161,95,0.08)_52%,rgba(244,199,216,0.05))]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(240px,0.18fr)] lg:items-end">
          <div>
            <h2 id="movie-search" className="text-2xl font-semibold text-[#fff7ea]">
              찾고 싶은 영화가 있나요?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
              TMDb에서 영화를 찾아 여운의 영화 목록에 조용히 담아둘 수 있어요.
            </p>
          </div>

          <p className="text-sm font-medium leading-6 text-[#f2b482] lg:text-right">
            검색한 영화는 선택하는 순간 저장돼요.
          </p>
        </div>

        <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
          <label className="sr-only" htmlFor="movie-search-query">
            영화 제목 검색
          </label>
          <input
            id="movie-search-query"
            className="min-h-12 flex-1 rounded-full border border-[#fff7ea]/16 bg-[#12100f]/72 px-5 py-3 text-base text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/68 focus:border-[#f0a15f] focus:ring-2 focus:ring-[#f0a15f]/30"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="영화 제목을 검색해보세요"
            type="search"
            value={query}
          />
          <Button
            className="shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSearching}
            type="submit"
          >
            {isSearching ? "검색 중..." : "검색하기"}
          </Button>
        </form>

        {errorMessage ? (
          <p className="mt-4 rounded-lg border border-[#f4c7d8]/20 bg-[#f4c7d8]/10 px-4 py-3 text-sm font-medium text-[#f4c7d8]">
            {errorMessage}
          </p>
        ) : null}

        {hasSearched && !isSearching && results.length === 0 && !errorMessage ? (
          <div className="mt-6 rounded-lg border border-dashed border-[#fff7ea]/16 bg-[#12100f]/36 px-5 py-8 text-center">
            <p className="text-base font-semibold text-[#fff7ea]">
              검색 결과가 없어요. 다른 제목으로 찾아볼까요?
            </p>
          </div>
        ) : null}

        {results.length > 0 ? (
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((movie) => (
              <article
                className="flex h-full overflow-hidden rounded-lg border border-[#fff7ea]/12 bg-[#12100f]/44"
                key={movie.tmdb_id}
              >
                <div
                  aria-label={`${movie.title} 포스터`}
                  className="min-h-44 w-28 shrink-0 bg-[linear-gradient(145deg,rgba(240,161,95,0.24),rgba(244,199,216,0.12),rgba(18,16,15,0.88))] bg-cover bg-center"
                  role="img"
                  style={
                    movie.poster_url
                      ? { backgroundImage: `url(${movie.poster_url})` }
                      : undefined
                  }
                />
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-[#fff7ea]">
                      {movie.title}
                    </h3>
                    <p className="mt-1 text-sm text-[#f2b482]">
                      {getReleaseYear(movie.release_date)}
                    </p>
                  </div>

                  <p className="mt-4 flex-1 text-sm leading-6 text-[#e7d4c0]">
                    {getOverviewPreview(movie.overview)}
                  </p>

                  <Button
                    className="mt-5 min-h-10 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={savingTmdbId === movie.tmdb_id}
                    onClick={() => handleSelectMovie(movie)}
                    variant="secondary"
                  >
                    {savingTmdbId === movie.tmdb_id
                      ? "담는 중..."
                      : "이 영화로 보기"}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </Card>
    </section>
  );
}
