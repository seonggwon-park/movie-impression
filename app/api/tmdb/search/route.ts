import { searchTmdbMovies } from "@/lib/tmdb";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query) {
    return Response.json(
      { message: "검색어를 입력해주세요.", results: [] },
      { status: 400 },
    );
  }

  try {
    const results = await searchTmdbMovies(query);

    return Response.json({ results });
  } catch (error) {
    console.error("TMDb movie search failed", error);

    return Response.json(
      { message: "영화를 검색하는 중 문제가 생겼어요." },
      { status: 500 },
    );
  }
}
