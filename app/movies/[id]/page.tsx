import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ButtonLink,
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import {
  getMovieByIdOrSlug,
  placeholderMovies,
} from "@/lib/placeholder-data";

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
  const movie = getMovieByIdOrSlug(id);

  if (!movie) {
    notFound();
  }

  return (
    <main className="bg-[#12100f] text-[#fff7ea]">
      <PageContainer className="py-16 sm:py-24">
        <Link
          href="/movies"
          className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-[#c9ad96] transition hover:bg-[#fff7ea]/8 hover:text-[#fff7ea] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
        >
          영화 목록으로
        </Link>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:items-start">
          <div className="aspect-[2/3] rounded-lg border border-[#fff7ea]/12 bg-[linear-gradient(145deg,rgba(240,161,95,0.22),rgba(244,199,216,0.12)_46%,rgba(18,16,15,0.82))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.3)]">
            <div className="flex h-full flex-col justify-end rounded-md border border-[#fff7ea]/10 bg-[#12100f]/28 p-6">
              <p className="text-sm text-[#f2b482]">남은 장면</p>
              <p className="mt-3 text-4xl font-semibold leading-tight text-[#fff7ea]">
                {movie.title}
              </p>
            </div>
          </div>

          <div>
            <SectionHeader
              eyebrow={`${movie.releaseYear} · ${movie.genre}`}
              title={movie.title}
              description={movie.synopsis}
              titleAs="h1"
            />

            <dl className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["감독", movie.director],
                ["상영 시간", movie.runningTime],
                ["대표 감정", movie.mainEmotion],
              ].map(([label, value]) => (
                <Card key={label} className="p-4">
                  <dt className="text-sm text-[#c9ad96]">{label}</dt>
                  <dd className="mt-2 font-semibold text-[#fff7ea]">{value}</dd>
                </Card>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/impressions/new">이 영화 감상 남기기</ButtonLink>
              <ButtonLink href="/movies" variant="secondary">
                다른 영화 보기
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
          <Card>
            <h2 className="text-xl font-semibold text-[#fff7ea]">
              감정 분포
            </h2>
            <div className="mt-6 space-y-5">
              {movie.emotionDistribution.map((emotion) => (
                <div key={emotion.emotion}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <EmotionTag as="span" tone={emotion.tone}>
                      {emotion.emotion}
                    </EmotionTag>
                    <span className="font-medium text-[#f2b482]">
                      {emotion.percent}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#fff7ea]/10">
                    <div
                      className="h-2 rounded-full bg-[#f0a15f]"
                      style={{ width: `${emotion.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-semibold text-[#fff7ea]">
              남겨진 감상
            </h2>
            <div className="mt-6 space-y-5">
              {movie.impressions.map((impression) => (
                <article
                  key={`${impression.author}-${impression.date}`}
                  className="border-t border-[#fff7ea]/10 pt-5 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <EmotionTag as="span" tone={movie.emotionTone}>
                      {impression.emotion}
                    </EmotionTag>
                    <span className="text-sm text-[#c9ad96]">
                      {impression.author} · {impression.date}
                    </span>
                  </div>
                  <p className="mt-4 text-base leading-7 text-[#e7d4c0]">
                    “{impression.note}”
                  </p>
                </article>
              ))}
            </div>
          </Card>
        </section>
      </PageContainer>
    </main>
  );
}
