import { MovieDetail } from "./movie-detail";

export const dynamic = "force-dynamic";

type MovieDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MovieDetailPage({
  params,
}: MovieDetailPageProps) {
  const { id } = await params;

  return <MovieDetail identifier={id} />;
}
