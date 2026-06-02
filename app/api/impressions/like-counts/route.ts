import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SupabaseLikeCountRow = {
  impression_id: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseImpressionIds(request: Request) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams
    .get("ids")
    ?.split(",")
    .map((id) => id.trim())
    .filter((id, index, allIds) => uuidPattern.test(id) && allIds.indexOf(id) === index)
    .slice(0, 100);

  return ids ?? [];
}

export async function GET(request: Request) {
  try {
    const impressionIds = parseImpressionIds(request);

    if (impressionIds.length === 0) {
      return Response.json({ counts: {} });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("impression_likes")
      .select("impression_id")
      .in("impression_id", impressionIds);

    if (error) {
      console.error("Impression like counts load failed", error);

      return Response.json(
        { message: "공감 수를 불러오지 못했어요." },
        { status: 500 },
      );
    }

    const counts = ((data ?? []) as SupabaseLikeCountRow[]).reduce<
      Record<string, number>
    >((currentCounts, like) => {
      currentCounts[like.impression_id] =
        (currentCounts[like.impression_id] ?? 0) + 1;
      return currentCounts;
    }, {});

    return Response.json({ counts });
  } catch (error) {
    console.error("Impression like counts route failed", error);

    return Response.json(
      { message: "공감 수를 불러오지 못했어요." },
      { status: 500 },
    );
  }
}
