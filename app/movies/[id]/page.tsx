import { placeholderMovies } from "@/lib/placeholder-data";
import { MovieDetail } from "./movie-detail";

export const dynamic = "force-dynamic";

type MovieDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return placeholderMovies.flatMap((movie) => [
    { id: movie.id },
    { id: movie.slug },
  ]);
}

export default async function MovieDetailPage({
  params,
}: MovieDetailPageProps) {
  const { id } = await params;

  return <MovieDetail identifier={id} />;
}
