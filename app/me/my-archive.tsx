"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ButtonLink,
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import type { EmotionTone } from "@/lib/placeholder-data";
import {
  getSupabaseBrowserClient,
  hasSupabaseConfig,
} from "@/lib/supabase";

type MaybeArray<T> = T | T[] | null;

type SupabaseMovieRow = {
  id: string;
  title: string;
  slug: string | null;
  poster_url: string | null;
  release_date: string | null;
};

type SupabaseEmotionRow = {
  id: string;
  name: string;
  emoji: string | null;
};

type SupabaseImpressionRow = {
  id: string;
  one_line: string;
  note: string | null;
  rating: number | null;
  watched_at: string | null;
  created_at: string | null;
  movies: MaybeArray<SupabaseMovieRow>;
  impression_emotions:
    | Array<{
        emotions: MaybeArray<SupabaseEmotionRow>;
      }>
    | null;
};

type MovieView = {
  id: string;
  title: string;
  slug: string | null;
  posterUrl: string | null;
  releaseDate: string | null;
};

type EmotionView = {
  id: string;
  name: string;
  emoji: string | null;
};

type ImpressionView = {
  id: string;
  oneLine: string;
  note: string | null;
  rating: number | null;
  watchedAt: string | null;
  createdAt: string | null;
  movie: MovieView;
  emotions: EmotionView[];
};

const missingSupabaseEnvMessage =
  "Supabase 환경변수가 설정되지 않았어요. .env.local을 확인해주세요.";

const emotionToneByName: Record<string, EmotionTone> = {
  먹먹함: "warm",
  설렘: "rose",
  위로됨: "violet",
  통쾌함: "warm",
  찝찝함: "violet",
  무서움: "violet",
  혼란스러움: "violet",
  따뜻함: "warm",
  슬픔: "rose",
  웃김: "warm",
  압도됨: "rose",
  "여운 남음": "warm",
};

function getLoginPath() {
  return `/login?next=${encodeURIComponent("/me")}`;
}

function getEmotionTone(emotionName: string): EmotionTone {
  return emotionToneByName[emotionName] ?? "warm";
}

function getSingleRelation<T>(value: MaybeArray<T>) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function getReleaseYear(value: string | null) {
  return value ? value.slice(0, 4) : null;
}

function getMovieHref(movie: MovieView) {
  return `/movies/${movie.slug || movie.id}`;
}

function getNotePreview(note: string) {
  return note.length > 150 ? `${note.slice(0, 150)}...` : note;
}

function normalizeImpression(row: SupabaseImpressionRow): ImpressionView {
  const movie = getSingleRelation(row.movies);
  const emotions =
    row.impression_emotions
      ?.map((item) => getSingleRelation(item.emotions))
      .filter((emotion): emotion is SupabaseEmotionRow => Boolean(emotion)) ??
    [];

  return {
    id: row.id,
    oneLine: row.one_line,
    note: row.note,
    rating: row.rating,
    watchedAt: row.watched_at,
    createdAt: row.created_at,
    movie: {
      id: movie?.id ?? "",
      title: movie?.title ?? "제목 없는 영화",
      slug: movie?.slug ?? null,
      posterUrl: movie?.poster_url ?? null,
      releaseDate: movie?.release_date ?? null,
    },
    emotions,
  };
}

function getMostUsedEmotion(impressions: ImpressionView[]) {
  const counts = impressions
    .flatMap((impression) => impression.emotions)
    .reduce<Record<string, { emotion: EmotionView; count: number }>>(
      (current, emotion) => ({
        ...current,
        [emotion.name]: {
          emotion,
          count: (current[emotion.name]?.count ?? 0) + 1,
        },
      }),
      {},
    );

  return Object.values(counts).sort((a, b) => b.count - a.count)[0]?.emotion;
}

function getRecentEmotions(impressions: ImpressionView[]) {
  return impressions
    .flatMap((impression) =>
      impression.emotions.map((emotion) => ({
        id: `${impression.id}-${emotion.id}`,
        emotion,
        movieTitle: impression.movie.title,
        date: impression.watchedAt ?? impression.createdAt,
      })),
    )
    .slice(0, 6);
}

function getEmotionLabel(emotion: EmotionView) {
  return emotion.emoji ? `${emotion.emoji} ${emotion.name}` : emotion.name;
}

export function MyArchive() {
  const router = useRouter();
  const isSupabaseConfigured = hasSupabaseConfig();
  const [impressions, setImpressions] = useState<ImpressionView[]>([]);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [errorMessage, setErrorMessage] = useState(
    isSupabaseConfigured ? "" : missingSupabaseEnvMessage,
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    async function loadMyImpressions() {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError) {
        console.error("Supabase getUser failed", userError);
      }

      if (!userData.user) {
        router.replace(getLoginPath());
        return;
      }

      const { data, error } = await supabase
        .from("impressions")
        .select(
          `
          id,
          one_line,
          note,
          rating,
          watched_at,
          created_at,
          movies (
            id,
            title,
            slug,
            poster_url,
            release_date
          ),
          impression_emotions (
            emotions (
              id,
              name,
              emoji
            )
          )
        `,
        )
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Supabase my impressions load failed", error);
        setErrorMessage(`나의 감상을 불러오지 못했어요. ${error.message}`);
        setIsLoading(false);
        return;
      }

      setImpressions(
        ((data ?? []) as SupabaseImpressionRow[]).map(normalizeImpression),
      );
      setIsLoading(false);
    }

    loadMyImpressions();

    return () => {
      isMounted = false;
    };
  }, [isSupabaseConfigured, router]);

  const hasImpressions = impressions.length > 0;
  const mostUsedEmotion = getMostUsedEmotion(impressions);
  const recentImpression = impressions[0];
  const recentEmotions = getRecentEmotions(impressions);

  const summaryItems = [
    {
      label: "총 감상 수",
      value: `${impressions.length.toLocaleString("ko-KR")}개`,
      description: "직접 남긴 마음의 기록",
    },
    {
      label: "가장 많이 남은 감정",
      value: mostUsedEmotion ? getEmotionLabel(mostUsedEmotion) : "아직 없음",
      description: "지금까지 가장 자주 고른 감정",
      emotion: mostUsedEmotion,
    },
    {
      label: "최근 남긴 날짜",
      value: formatDate(recentImpression?.createdAt ?? null) ?? "아직 없음",
      description: recentImpression
        ? `${recentImpression.movie.title}에 남긴 감상`
        : "첫 감상을 기다리고 있어요.",
    },
    {
      label: "최근 감정",
      value: recentEmotions[0]
        ? getEmotionLabel(recentEmotions[0].emotion)
        : "아직 없음",
      description: recentEmotions[0]
        ? `${recentEmotions[0].movieTitle}에서 남은 마음`
        : "최근 감정이 아직 없어요.",
      emotion: recentEmotions[0]?.emotion,
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

        {isLoading ? (
          <Card className="mt-12 p-6">
            <p className="text-sm font-medium text-[#f2b482]">
              감상을 불러오는 중
            </p>
            <p className="mt-3 text-xl font-semibold leading-8 text-[#fff7ea]">
              저장해 둔 여운을 조용히 꺼내고 있어요.
            </p>
          </Card>
        ) : null}

        {errorMessage ? (
          <Card className="mt-12 border-[#f4c7d8]/24 bg-[#f4c7d8]/10 p-6">
            <p className="text-sm font-medium text-[#f4c7d8]">
              불러오기 오류
            </p>
            <p className="mt-3 text-base leading-7 text-[#f4c7d8]">
              {errorMessage}
            </p>
          </Card>
        ) : null}

        {!isLoading && !errorMessage ? (
          <>
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
                    {item.emotion ? (
                      <EmotionTag
                        as="span"
                        tone={getEmotionTone(item.emotion.name)}
                      >
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
                        영화마다 남겨둔 감정과 한 줄을 천천히 다시 볼 수
                        있어요.
                      </p>
                    </div>
                    <ButtonLink href="/impressions/new">
                      감상 더 남기기
                    </ButtonLink>
                  </div>

                  <div className="mt-8 space-y-5">
                    {impressions.map((impression) => {
                      const releaseYear = getReleaseYear(
                        impression.movie.releaseDate,
                      );
                      const watchedDate = formatDate(impression.watchedAt);
                      const createdDate = formatDate(impression.createdAt);

                      return (
                        <Card
                          key={impression.id}
                          className="overflow-hidden p-0"
                        >
                          <article className="grid md:grid-cols-[168px_minmax(0,1fr)]">
                            <div
                              className="border-b border-[#fff7ea]/10 bg-[linear-gradient(145deg,rgba(240,161,95,0.2),rgba(244,199,216,0.1)_48%,rgba(18,16,15,0.88))] bg-cover bg-center p-4 md:border-b-0 md:border-r"
                              style={
                                impression.movie.posterUrl
                                  ? {
                                      backgroundImage: `linear-gradient(180deg,rgba(18,16,15,0.1),rgba(18,16,15,0.84)),url(${impression.movie.posterUrl})`,
                                    }
                                  : undefined
                              }
                            >
                              <div className="aspect-[2/3] rounded-md border border-[#fff7ea]/10 bg-[#12100f]/34 p-4 backdrop-blur-[1px]">
                                <div className="flex h-full flex-col justify-between">
                                  <p className="text-xs font-medium text-[#f2b482]">
                                    남은 장면
                                  </p>
                                  <div>
                                    <p className="text-2xl font-semibold leading-tight text-[#fff7ea]">
                                      {impression.movie.title}
                                    </p>
                                    {releaseYear ? (
                                      <p className="mt-2 text-sm text-[#e7d4c0]">
                                        {releaseYear}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="p-5 sm:p-6">
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  {watchedDate ? (
                                    <p className="text-sm text-[#c9ad96]">
                                      {watchedDate}
                                    </p>
                                  ) : null}
                                  <h3 className="mt-2 text-2xl font-semibold text-[#fff7ea]">
                                    {impression.movie.title}
                                  </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {impression.emotions.map((emotion) => (
                                    <EmotionTag
                                      as="span"
                                      key={emotion.id}
                                      tone={getEmotionTone(emotion.name)}
                                    >
                                      {getEmotionLabel(emotion)}
                                    </EmotionTag>
                                  ))}
                                </div>
                              </div>

                              <p className="mt-6 text-xl leading-8 text-[#fff7ea]">
                                “{impression.oneLine}”
                              </p>

                              {impression.note ? (
                                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#e7d4c0]">
                                  {getNotePreview(impression.note)}
                                </p>
                              ) : null}

                              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap gap-3 text-sm text-[#c9ad96]">
                                  {watchedDate ? (
                                    <span>본 날짜 {watchedDate}</span>
                                  ) : null}
                                  {!watchedDate && createdDate ? (
                                    <span>남긴 날짜 {createdDate}</span>
                                  ) : null}
                                  {impression.rating ? (
                                    <span>별점 {impression.rating}</span>
                                  ) : null}
                                </div>
                                {impression.movie.id ? (
                                  <ButtonLink
                                    href={getMovieHref(impression.movie)}
                                    variant="secondary"
                                    className="px-4 py-2 text-sm"
                                  >
                                    영화 다시 보기
                                  </ButtonLink>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        </Card>
                      );
                    })}
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
                        {recentEmotions.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-[#fff7ea]/10 bg-[#12100f]/36 p-4"
                          >
                            <EmotionTag
                              as="span"
                              tone={getEmotionTone(item.emotion.name)}
                            >
                              {getEmotionLabel(item.emotion)}
                            </EmotionTag>
                            <p className="mt-4 font-semibold text-[#fff7ea]">
                              {item.movieTitle}
                            </p>
                            {item.date ? (
                              <p className="mt-1 text-sm text-[#c9ad96]">
                                {formatDate(item.date)}
                              </p>
                            ) : null}
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
          </>
        ) : null}
      </PageContainer>
    </main>
  );
}
