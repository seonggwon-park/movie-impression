import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTmdbMovieDetails } from "@/lib/tmdb";

type MovieUpsertPayload = {
  tmdb_id?: unknown;
};

function createMovieSlug(tmdbId: number | null, fallbackId?: string) {
  if (tmdbId && Number.isSafeInteger(tmdbId) && tmdbId > 0) {
    return `tmdb-${tmdbId}`;
  }

  const safeFragment = fallbackId
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return `movie-${safeFragment || crypto.randomUUID().slice(0, 8)}`;
}

function getErrorDetail(error: unknown) {
  return error instanceof Error ? error.message : "Unknown server error.";
}

function jsonError(message: string, detail: string, status = 500) {
  return Response.json({ message, detail }, { status });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as MovieUpsertPayload;
    const tmdbId =
      typeof payload.tmdb_id === "number" ? Math.trunc(payload.tmdb_id) : NaN;

    if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
      return jsonError(
        "저장할 영화 정보를 확인해주세요.",
        "tmdb_id must be a positive number.",
        400,
      );
    }

    const supabase = createSupabaseAdminClient();
    const tmdbMovie = await getTmdbMovieDetails(tmdbId);

    const { data, error } = await supabase
      .from("movies")
      .upsert(
        {
          tmdb_id: tmdbMovie.tmdb_id,
          title: tmdbMovie.title,
          original_title: tmdbMovie.original_title,
          overview: tmdbMovie.overview,
          poster_url: tmdbMovie.poster_url,
          release_date: tmdbMovie.release_date,
          runtime: tmdbMovie.runtime,
          genres: tmdbMovie.genres,
          slug: createMovieSlug(tmdbMovie.tmdb_id, String(tmdbMovie.tmdb_id)),
        },
        { onConflict: "tmdb_id" },
      )
      .select("id, slug, title, tmdb_id")
      .single();

    if (error) {
      console.error("Supabase movie upsert failed", error);

      return jsonError(
        "영화 정보를 저장하는 중 문제가 생겼어요.",
        error.message,
      );
    }

    return Response.json({ movie: data });
  } catch (error) {
    console.error("Movie upsert route failed", error);

    return jsonError(
      "영화 정보를 저장하는 중 문제가 생겼어요.",
      getErrorDetail(error),
    );
  }
}
