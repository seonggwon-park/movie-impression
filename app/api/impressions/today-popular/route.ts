import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type MaybeArray<T> = T | T[] | null;

type SupabaseEmotionRow = {
  id: string;
  name: string;
  emoji: string | null;
};

type SupabaseMovieRow = {
  id: string;
  title: string;
  slug: string | null;
};

type SupabaseImpressionRow = {
  id: string;
  one_line: string;
  note: string | null;
  watched_at: string | null;
  movies: MaybeArray<SupabaseMovieRow>;
  impression_emotions:
    | Array<{
        emotions: MaybeArray<SupabaseEmotionRow>;
      }>
    | null;
};

type SupabaseLikeRow = {
  impression_id: string;
  impressions: MaybeArray<SupabaseImpressionRow>;
};

const popularImpressionLimit = 3;

function getSingleRelation<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function getSeoulTodayBounds(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const start = new Date(Date.UTC(year, month - 1, day, -9));
  const end = new Date(start);

  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

export async function GET() {
  try {
    const { start, end } = getSeoulTodayBounds();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("impression_likes")
      .select(
        `
          impression_id,
          impressions (
            id,
            one_line,
            note,
            watched_at,
            movies (
              id,
              title,
              slug
            ),
            impression_emotions (
              emotions (
                id,
                name,
                emoji
              )
            )
          )
        `,
      )
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Today popular impressions load failed", error);

      return Response.json(
        { message: "오늘 공감 받은 감상을 불러오지 못했어요." },
        { status: 500 },
      );
    }

    const impressionsById = new Map<
      string,
      {
        id: string;
        oneLine: string;
        note: string | null;
        watchedAt: string | null;
        movie: SupabaseMovieRow;
        emotions: SupabaseEmotionRow[];
        todayLikeCount: number;
      }
    >();

    ((data ?? []) as SupabaseLikeRow[]).forEach((like) => {
      const impression = getSingleRelation(like.impressions);
      const movie = getSingleRelation(impression?.movies ?? null);

      if (!impression || !movie) {
        return;
      }

      const existing = impressionsById.get(impression.id);

      if (existing) {
        existing.todayLikeCount += 1;
        return;
      }

      impressionsById.set(impression.id, {
        id: impression.id,
        oneLine: impression.one_line,
        note: impression.note,
        watchedAt: impression.watched_at,
        movie,
        emotions:
          impression.impression_emotions
            ?.map((item) => getSingleRelation(item.emotions))
            .filter(
              (emotion): emotion is SupabaseEmotionRow => Boolean(emotion),
            ) ?? [],
        todayLikeCount: 1,
      });
    });

    const impressions = [...impressionsById.values()]
      .sort(
        (a, b) =>
          b.todayLikeCount - a.todayLikeCount ||
          a.oneLine.localeCompare(b.oneLine, "ko-KR"),
      )
      .slice(0, popularImpressionLimit);

    return Response.json({ impressions });
  } catch (error) {
    console.error("Today popular impressions route failed", error);

    return Response.json(
      { message: "오늘 공감 받은 감상을 불러오지 못했어요." },
      { status: 500 },
    );
  }
}
