const tmdbApiBaseUrl = "https://api.themoviedb.org/3";
const tmdbPosterBaseUrl = "https://image.tmdb.org/t/p/w500";
const tmdbProviderLogoBaseUrl = "https://image.tmdb.org/t/p/w92";

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

type TmdbWatchProviderItem = {
  display_priority?: number;
  logo_path?: string | null;
  provider_id?: number;
  provider_name?: string;
};

type TmdbWatchProviderRegion = {
  link?: string;
  flatrate?: TmdbWatchProviderItem[];
  rent?: TmdbWatchProviderItem[];
  buy?: TmdbWatchProviderItem[];
  ads?: TmdbWatchProviderItem[];
};

type TmdbWatchProvidersResponse = {
  results?: Record<string, TmdbWatchProviderRegion>;
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

export type NormalizedWatchProviderCategory =
  | "구독"
  | "대여"
  | "구매"
  | "무료/광고";

export type NormalizedWatchProvider = {
  provider_id: number;
  provider_name: string;
  logo_url: string | null;
  category: NormalizedWatchProviderCategory;
  link: string | null;
  display_priority: number;
};

export type NormalizedWatchProviderResult = {
  link: string | null;
  providers: NormalizedWatchProvider[];
};

const watchProviderCategoryLabels = {
  flatrate: "구독",
  rent: "대여",
  buy: "구매",
  ads: "무료/광고",
} satisfies Record<string, NormalizedWatchProviderCategory>;

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

function getProviderLogoUrl(logoPath?: string | null) {
  return logoPath ? `${tmdbProviderLogoBaseUrl}${logoPath}` : null;
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

export async function getTmdbWatchProviders(tmdbId: number, region = "KR") {
  const data = await fetchTmdb<TmdbWatchProvidersResponse>(
    `/movie/${tmdbId}/watch/providers`,
    {},
  );
  const regionProviders = data.results?.[region];

  if (!regionProviders) {
    return { link: null, providers: [] } satisfies NormalizedWatchProviderResult;
  }

  const link = regionProviders.link ?? null;
  const providers = (
    Object.entries(watchProviderCategoryLabels) as Array<
      [keyof typeof watchProviderCategoryLabels, NormalizedWatchProviderCategory]
    >
  )
    .flatMap(([categoryKey, category]) =>
      (regionProviders[categoryKey] ?? [])
        .filter(
          (provider) =>
            typeof provider.provider_id === "number" &&
            Boolean(provider.provider_name?.trim()),
        )
        .map((provider) => ({
          provider_id: provider.provider_id as number,
          provider_name: provider.provider_name?.trim() ?? "",
          logo_url: getProviderLogoUrl(provider.logo_path),
          category,
          link,
          display_priority: provider.display_priority ?? 999,
        })),
    )
    .sort(
      (a, b) =>
        a.display_priority - b.display_priority ||
        a.provider_name.localeCompare(b.provider_name, "ko-KR"),
    );

  return { link, providers } satisfies NormalizedWatchProviderResult;
}
