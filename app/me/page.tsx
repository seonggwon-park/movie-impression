import {
  ButtonLink,
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import {
  type EmotionTone,
  emotionOptions,
  myImpressions,
} from "@/lib/placeholder-data";

const emotionToneByLabel = new Map(
  emotionOptions.map((emotion) => [emotion.label, emotion.tone]),
);

const sortedMyImpressions = [...myImpressions].sort((a, b) =>
  b.watchedAt.localeCompare(a.watchedAt),
);

const allEmotionLabels = myImpressions.flatMap(
  (impression) => impression.emotions,
);

const recentImpression = sortedMyImpressions[0];
const archiveMonth = recentImpression?.watchedAt.slice(0, 7);

const thisMonthEmotionLabels = archiveMonth
  ? myImpressions
      .filter((impression) => impression.watchedAt.startsWith(archiveMonth))
      .flatMap((impression) => impression.emotions)
  : [];

const moodArchiveItems = sortedMyImpressions
  .flatMap((impression) =>
    impression.emotions.map((emotion) => ({
      id: `${impression.id}-${emotion}`,
      emotion,
      movieTitle: impression.movieTitle,
      watchedAt: impression.watchedAt,
    })),
  )
  .slice(0, 6);

function getToneForEmotion(emotion: string): EmotionTone {
  return emotionToneByLabel.get(emotion) ?? "warm";
}

function getTopEmotion(emotions: readonly string[]) {
  const emotionCounts = emotions.reduce<Record<string, number>>(
    (counts, emotion) => ({
      ...counts,
      [emotion]: (counts[emotion] ?? 0) + 1,
    }),
    {},
  );

  return (
    Object.entries(emotionCounts).sort(([, aCount], [, bCount]) => {
      return bCount - aCount;
    })[0]?.[0] ?? "아직 없음"
  );
}

function formatArchiveMonth(month: string) {
  const [year, monthValue] = month.split(".");

  return `${year}년 ${Number(monthValue)}월`;
}

export default function MyPage() {
  const hasImpressions = myImpressions.length > 0;
  const mostCommonEmotion = getTopEmotion(allEmotionLabels);
  const thisMonthEmotion = getTopEmotion(thisMonthEmotionLabels);

  const summaryItems = [
    {
      label: "총 감상 수",
      value: `${myImpressions.length.toLocaleString("ko-KR")}개`,
      description: "짧게 남겨둔 마음의 기록",
    },
    {
      label: "가장 많이 남은 감정",
      value: mostCommonEmotion,
      description: "최근 감상에서 가장 자주 보인 마음",
      emotion: mostCommonEmotion,
    },
    {
      label: "최근 남긴 감상",
      value: recentImpression?.movieTitle ?? "아직 없음",
      description: recentImpression
        ? `${recentImpression.watchedAt} · ${recentImpression.note}`
        : "첫 감상을 기다리고 있어요.",
    },
    {
      label: "이번 달의 감정",
      value: thisMonthEmotion,
      description: archiveMonth
        ? `${formatArchiveMonth(archiveMonth)}에 가장 자주 남은 감정`
        : "이번 달 기록이 아직 없어요.",
      emotion: thisMonthEmotion,
    },
  ];

  return (
    <main className="bg-[#12100f] text-[#fff7ea]">
      <PageContainer className="py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] lg:items-end">
          <SectionHeader
            eyebrow="개인 아카이브"
            title="나의 여운"
            description="내가 본 영화들이 어떤 감정으로 남았는지 모아보세요."
            titleAs="h1"
          />

          <Card className="bg-[linear-gradient(145deg,rgba(240,161,95,0.16),rgba(244,199,216,0.08)_52%,rgba(255,247,234,0.06))]">
            <p className="text-sm font-medium text-[#f2b482]">
              오늘 다시 꺼내 본 감정
            </p>
            <p className="mt-4 text-2xl font-semibold leading-9 text-[#fff7ea]">
              감상은 짧아도, 마음에 남은 장면은 오래 머물러요.
            </p>
          </Card>
        </div>

        <section
          className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="나의 감상 요약"
        >
          {summaryItems.map((item) => (
            <Card key={item.label} className="p-5">
              <p className="text-sm font-medium text-[#c9ad96]">
                {item.label}
              </p>
              <div className="mt-4">
                {item.emotion && item.value !== "아직 없음" ? (
                  <EmotionTag as="span" tone={getToneForEmotion(item.emotion)}>
                    {item.value}
                  </EmotionTag>
                ) : (
                  <p className="text-3xl font-semibold text-[#fff7ea]">
                    {item.value}
                  </p>
                )}
              </div>
              <p className="mt-4 text-sm leading-6 text-[#c9ad96]">
                {item.description}
              </p>
            </Card>
          ))}
        </section>

        {hasImpressions ? (
          <>
            <section className="mt-16" aria-labelledby="my-impression-list">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2
                    id="my-impression-list"
                    className="text-2xl font-semibold text-[#fff7ea]"
                  >
                    내가 남긴 감상
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
                    영화마다 남겨둔 감정과 한 줄을 천천히 다시 볼 수 있어요.
                  </p>
                </div>
                <ButtonLink href="/impressions/new">감상 더 남기기</ButtonLink>
              </div>

              <div className="mt-8 space-y-5">
                {sortedMyImpressions.map((impression) => (
                  <Card key={impression.id} className="overflow-hidden p-0">
                    <article className="grid md:grid-cols-[168px_minmax(0,1fr)]">
                      <div className="border-b border-[#fff7ea]/10 bg-[linear-gradient(145deg,rgba(240,161,95,0.2),rgba(244,199,216,0.1)_48%,rgba(18,16,15,0.88))] p-4 md:border-b-0 md:border-r">
                        <div className="aspect-[2/3] rounded-md border border-[#fff7ea]/10 bg-[#12100f]/34 p-4">
                          <div className="flex h-full flex-col justify-between">
                            <p className="text-xs font-medium text-[#f2b482]">
                              남은 장면
                            </p>
                            <div>
                              <p className="text-2xl font-semibold leading-tight text-[#fff7ea]">
                                {impression.movieTitle}
                              </p>
                              <p className="mt-2 text-sm text-[#e7d4c0]">
                                {impression.watchedAt}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-sm text-[#c9ad96]">
                              {impression.watchedAt}
                            </p>
                            <h3 className="mt-2 text-2xl font-semibold text-[#fff7ea]">
                              {impression.movieTitle}
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {impression.emotions.map((emotion) => (
                              <EmotionTag
                                as="span"
                                key={emotion}
                                tone={getToneForEmotion(emotion)}
                              >
                                {emotion}
                              </EmotionTag>
                            ))}
                          </div>
                        </div>

                        <p className="mt-6 text-xl leading-8 text-[#fff7ea]">
                          “{impression.note}”
                        </p>

                        {impression.longerNote ? (
                          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#e7d4c0]">
                            {impression.longerNote}
                          </p>
                        ) : null}

                        <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap gap-3 text-sm text-[#c9ad96]">
                            <span>본 날짜 {impression.watchedAt}</span>
                            {impression.rating ? (
                              <span>별점 {impression.rating}</span>
                            ) : null}
                          </div>
                          <ButtonLink
                            href={`/movies/${impression.movieSlug}`}
                            variant="secondary"
                            className="px-4 py-2 text-sm"
                          >
                            영화 다시 보기
                          </ButtonLink>
                        </div>
                      </div>
                    </article>
                  </Card>
                ))}
              </div>
            </section>

            <section className="mt-16" aria-labelledby="mood-archive">
              <Card className="bg-[linear-gradient(145deg,rgba(255,247,234,0.07),rgba(240,161,95,0.12)_48%,rgba(200,182,255,0.08))] p-6 sm:p-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,1fr)] lg:items-start">
                  <div>
                    <p className="text-sm font-medium text-[#f2b482]">
                      무드 아카이브
                    </p>
                    <h2
                      id="mood-archive"
                      className="mt-3 text-3xl font-semibold leading-tight text-[#fff7ea]"
                    >
                      최근 감정의 조각들
                    </h2>
                    <p className="mt-4 text-base leading-7 text-[#c9ad96]">
                      날짜와 영화 제목 옆에 남은 감정을 작게 모아두었어요.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {moodArchiveItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-[#fff7ea]/10 bg-[#12100f]/36 p-4"
                      >
                        <EmotionTag as="span" tone={getToneForEmotion(item.emotion)}>
                          {item.emotion}
                        </EmotionTag>
                        <p className="mt-4 font-semibold text-[#fff7ea]">
                          {item.movieTitle}
                        </p>
                        <p className="mt-1 text-sm text-[#c9ad96]">
                          {item.watchedAt}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </section>
          </>
        ) : (
          <Card className="mt-16 border-dashed bg-[#fff7ea]/5 p-8 text-center">
            <p className="text-2xl font-semibold text-[#fff7ea]">
              아직 남긴 감상이 없어요.
            </p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#c9ad96]">
              첫 영화를 기록하면 이곳에 당신만의 여운이 쌓여요.
            </p>
            <ButtonLink href="/impressions/new" className="mt-7">
              첫 감상 남기기
            </ButtonLink>
          </Card>
        )}
      </PageContainer>
    </main>
  );
}
