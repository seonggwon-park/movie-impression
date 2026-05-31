import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTmdbMovieDetails } from "@/lib/tmdb";

type MovieUpsertPayload = {
  tmdb_id?: unknown;
};

function createMovieSlug(title: string, releaseDate: string | null, tmdbId: number) {
  const titlePart = title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  const yearPart = releaseDate?.slice(0, 4);

  return [titlePart || "movie", yearPart, String(tmdbId)]
    .filter(Boolean)
    .join("-");
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
          slug: createMovieSlug(
            tmdbMovie.title,
            tmdbMovie.release_date,
            tmdbMovie.tmdb_id,
          ),
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
