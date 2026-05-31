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
  type EmotionTone,
  type Movie,
  emotionOptions,
  getMovieByIdOrSlug,
  placeholderMovies,
} from "@/lib/placeholder-data";

type MovieDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const bookingLinks = [
  { label: "CGV", href: "https://www.cgv.co.kr/" },
  { label: "메가박스", href: "https://www.megabox.co.kr/" },
  { label: "롯데시네마", href: "https://www.lottecinema.co.kr/" },
] as const;

const sampleEmotionPercentages = [
  { emotion: "먹먹함", percent: 21 },
  { emotion: "위로됨", percent: 17 },
  { emotion: "찝찝함", percent: 12 },
  { emotion: "설렘", percent: 8 },
  { emotion: "압도됨", percent: 12 },
] as const;

const emotionToneByLabel = new Map(
  emotionOptions.map((emotion) => [emotion.label, emotion.tone]),
);

export function generateStaticParams() {
  return placeholderMovies.flatMap((movie) => [
    { id: movie.id },
    { id: movie.slug },
  ]);
}

function getToneForEmotion(emotion: string, fallback: EmotionTone) {
  return emotionToneByLabel.get(emotion) ?? fallback;
}

function getDisplayEmotionDistribution(movie: Movie) {
  const distribution = [
    {
      emotion: movie.mainEmotion,
      percent: 42,
      tone: movie.emotionTone,
    },
    ...sampleEmotionPercentages
      .filter((item) => item.emotion !== movie.mainEmotion)
      .map((item) => ({
        ...item,
        tone: getToneForEmotion(item.emotion, movie.emotionTone),
      })),
  ];

  return distribution.slice(0, 5);
}

export default async function MovieDetailPage({
  params,
}: MovieDetailPageProps) {
  const { id } = await params;
  const movie = getMovieByIdOrSlug(id);

  if (!movie) {
    notFound();
  }

  const emotionDistribution = getDisplayEmotionDistribution(movie);

  return (
    <main className="bg-[#12100f] text-[#fff7ea]">
      <PageContainer className="py-16 sm:py-24">
        <Link
          href="/movies"
          className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-[#c9ad96] transition hover:bg-[#fff7ea]/8 hover:text-[#fff7ea] focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
        >
          영화 목록으로
        </Link>

        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(260px,0.44fr)_minmax(0,1fr)] lg:items-start">
          <div className="rounded-lg border border-[#fff7ea]/12 bg-[linear-gradient(145deg,rgba(240,161,95,0.24),rgba(244,199,216,0.13)_46%,rgba(18,16,15,0.88))] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
            <div className="aspect-[2/3] rounded-md border border-[#fff7ea]/10 bg-[#12100f]/30 p-6">
              <div className="flex h-full flex-col justify-between">
                <p className="text-sm font-medium text-[#f2b482]">남은 장면</p>
                <div>
                  <p className="text-4xl font-semibold leading-tight text-[#fff7ea]">
                    {movie.title}
                  </p>
                  {movie.originalTitle ? (
                    <p className="mt-3 text-sm leading-6 text-[#e7d4c0]">
                      {movie.originalTitle}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader
              eyebrow={`${movie.releaseYear} · ${movie.genre} · ${movie.runningTime}`}
              title={movie.title}
              description={movie.synopsis}
              titleAs="h1"
            />

            {movie.originalTitle ? (
              <p className="mt-4 text-base text-[#c9ad96]">
                원제 {movie.originalTitle}
              </p>
            ) : null}

            <Card className="mt-8 bg-[#fff7ea]/9 p-6">
              <p className="text-sm font-medium text-[#f2b482]">
                대표 감정
              </p>
              <p className="mt-4 text-2xl font-semibold leading-9 text-[#fff7ea]">
                이 영화는 사람들에게 ‘{movie.mainEmotion}’으로 가장 많이
                남았어요.
              </p>
            </Card>

            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ["개봉", movie.releaseYear],
                ["장르", movie.genre],
                ["상영 시간", movie.runningTime],
              ].map(([label, value]) => (
                <Card key={label} className="p-4">
                  <dt className="text-sm text-[#c9ad96]">{label}</dt>
                  <dd className="mt-2 font-semibold text-[#fff7ea]">{value}</dd>
                </Card>
              ))}
            </dl>
          </div>
        </section>

        <section className="mt-16" aria-labelledby="booking-links">
          <Card className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 id="booking-links" className="text-xl font-semibold">
                  예매하러 가기
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
                  상영 시간과 좌석은 각 예매처에서 확인할 수 있어요.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {bookingLinks.map((link) => (
                  <ButtonLink
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    variant="secondary"
                  >
                    {link.label}
                  </ButtonLink>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-16" aria-labelledby="emotion-distribution">
          <Card className="bg-[linear-gradient(145deg,rgba(240,161,95,0.14),rgba(255,247,234,0.07))] p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:items-start">
              <div>
                <p className="text-sm font-medium text-[#f2b482]">
                  감정 분포
                </p>
                <h2
                  id="emotion-distribution"
                  className="mt-3 text-3xl font-semibold leading-tight text-[#fff7ea]"
                >
                  평점보다 먼저 보이는 마음의 지도
                </h2>
                <p className="mt-4 text-base leading-7 text-[#c9ad96]">
                  지금은 placeholder 감정 비율로, 이 영화가 어떤 분위기로
                  기억되는지 보여줘요.
                </p>
              </div>

              <div className="space-y-5">
                {emotionDistribution.map((emotion) => (
                  <div key={emotion.emotion}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <EmotionTag as="span" tone={emotion.tone}>
                        {emotion.emotion}
                      </EmotionTag>
                      <span className="text-lg font-semibold text-[#f2b482]">
                        {emotion.percent}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#12100f]/60">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#f0a15f,#f4c7d8)]"
                        style={{ width: `${emotion.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.44fr)]">
          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#fff7ea]">
                  사람들이 남긴 한 줄 감상
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
                  긴 리뷰보다 먼저 남은 감정의 기록들.
                </p>
              </div>
              <ButtonLink href="/impressions/new">나도 감상 남기기</ButtonLink>
            </div>

            {movie.impressions.length > 0 ? (
              <div className="mt-8 space-y-5">
                {movie.impressions.map((impression) => (
                  <article
                    key={`${impression.author}-${impression.date}`}
                    className="rounded-lg border border-[#fff7ea]/10 bg-[#12100f]/40 p-5"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <EmotionTag as="span" tone={movie.emotionTone}>
                        {impression.emotion}
                      </EmotionTag>
                      <span className="text-sm text-[#c9ad96]">
                        {impression.author} · {impression.date}
                      </span>
                      {impression.rating ? (
                        <span className="rounded-full bg-[#fff7ea]/8 px-3 py-1 text-sm text-[#e7d4c0]">
                          {impression.rating}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 text-lg leading-8 text-[#f1ddc9]">
                      “{impression.note}”
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <Card className="mt-8 border-dashed bg-[#fff7ea]/5 text-center">
                <p className="text-base leading-7 text-[#e7d4c0]">
                  아직 이 영화에 남겨진 감상이 없어요. 첫 감상을 남겨보세요.
                </p>
              </Card>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-[#fff7ea]">
              평론가의 짧은 시선
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
              감상을 방해하지 않도록, 참고용으로만 가볍게 모아두었어요.
            </p>

            <div className="mt-6 space-y-4">
              {movie.criticReviews.map((review) => (
                <article
                  key={`${review.criticName}-${review.outlet}`}
                  className="rounded-lg border border-[#fff7ea]/8 bg-[#fff7ea]/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-[#fff7ea]">
                        {review.criticName}
                      </h3>
                      <p className="mt-1 text-sm text-[#c9ad96]">
                        {review.outlet}
                      </p>
                    </div>
                    {review.rating ? (
                      <span className="text-sm font-medium text-[#f2b482]">
                        {review.rating}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#e7d4c0]">
                    {review.summary}
                  </p>
                  <a
                    href={review.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex rounded-full px-3 py-2 text-sm font-medium text-[#f2b482] transition hover:bg-[#fff7ea]/8 focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
                  >
                    출처 보기
                  </a>
                </article>
              ))}
            </div>
          </Card>
        </section>

        <section className="mt-16">
          <Card className="bg-[#fff7ea]/10 p-8 sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <p className="max-w-2xl text-2xl font-semibold leading-10 text-[#fff7ea]">
                이 영화가 당신에게는 어떤 감정으로 남았나요?
              </p>
              <ButtonLink href="/impressions/new" className="w-full sm:w-auto">
                나도 감상 남기기
              </ButtonLink>
            </div>
          </Card>
        </section>
      </PageContainer>
    </main>
  );
}
