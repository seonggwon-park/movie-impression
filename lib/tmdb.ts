const tmdbApiBaseUrl = "https://api.themoviedb.org/3";
const tmdbPosterBaseUrl = "https://image.tmdb.org/t/p/w500";

type TmdbMovieListItem = {
  id: number;
  title?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  release_date?: string;
};

type TmdbMovieDetail = TmdbMovieListItem & {
  runtime?: number | null;
  genres?: Array<{
    id: number;
    name: string;
  }>;
};

type TmdbSearchResponse = {
  results?: TmdbMovieListItem[];
};

export type NormalizedTmdbMovie = {
  tmdb_id: number;
  title: string;
  original_title: string | null;
  overview: string | null;
  poster_url: string | null;
  release_date: string | null;
  runtime: number | null;
  genres: string[];
};

function getTmdbApiKey() {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not configured.");
  }

  return apiKey;
}

function getPosterUrl(posterPath?: string | null) {
  return posterPath ? `${tmdbPosterBaseUrl}${posterPath}` : null;
}

function normalizeMovie(movie: TmdbMovieDetail): NormalizedTmdbMovie {
  return {
    tmdb_id: movie.id,
    title: movie.title?.trim() || movie.original_title?.trim() || "제목 없음",
    original_title: movie.original_title?.trim() || null,
    overview: movie.overview?.trim() || null,
    poster_url: getPosterUrl(movie.poster_path),
    release_date: movie.release_date || null,
    runtime: movie.runtime ?? null,
    genres: movie.genres?.map((genre) => genre.name).filter(Boolean) ?? [],
  };
}

async function fetchTmdb<T>(path: string, params: Record<string, string>) {
  const url = new URL(`${tmdbApiBaseUrl}${path}`);
  url.search = new URLSearchParams({
    api_key: getTmdbApiKey(),
    language: "ko-KR",
    ...params,
  }).toString();

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`TMDb request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function searchTmdbMovies(query: string) {
  const data = await fetchTmdb<TmdbSearchResponse>("/search/movie", {
    query,
    include_adult: "false",
    page: "1",
  });

  return (data.results ?? []).slice(0, 12).map(normalizeMovie);
}

export async function getTmdbMovieDetails(tmdbId: number) {
  return normalizeMovie(
    await fetchTmdb<TmdbMovieDetail>(`/movie/${tmdbId}`, {}),
  );
}
