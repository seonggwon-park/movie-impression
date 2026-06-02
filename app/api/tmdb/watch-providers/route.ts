import { getTmdbWatchProviders } from "@/lib/tmdb";

function getErrorDetail(error: unknown) {
  return error instanceof Error ? error.message : "Unknown server error.";
}

export async function GET(request: Request) {
  const tmdbIdParam = new URL(request.url).searchParams.get("tmdbId");
  const tmdbId = tmdbIdParam ? Number(tmdbIdParam) : NaN;

  if (!Number.isSafeInteger(tmdbId) || tmdbId <= 0) {
    return Response.json(
      {
        message: "시청처를 확인할 영화 정보가 올바르지 않아요.",
        providers: [],
        link: null,
      },
      { status: 400 },
    );
  }

  try {
    const result = await getTmdbWatchProviders(tmdbId, "KR");

    return Response.json(result);
  } catch (error) {
    console.error("TMDb watch providers load failed", error);

    return Response.json(
      {
        message: "시청처 정보를 불러오는 중 문제가 생겼어요.",
        detail: getErrorDetail(error),
        providers: [],
        link: null,
      },
      { status: 500 },
    );
  }
}
