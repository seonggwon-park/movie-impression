import {
  ButtonLink,
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import { placeholderMovies } from "@/lib/placeholder-data";

const filterChips = [
  { label: "전체", tone: "warm", selected: true },
  { label: "먹먹한", tone: "warm", selected: false },
  { label: "설레는", tone: "rose", selected: false },
  { label: "위로되는", tone: "violet", selected: false },
  { label: "통쾌한", tone: "warm", selected: false },
  { label: "찝찝한", tone: "violet", selected: false },
  { label: "여운 남는", tone: "warm", selected: false },
] as const;

const moviesByImpressionCount = [...placeholderMovies].sort(
  (a, b) => b.impressionCount - a.impressionCount,
);

const moviesByLingeringMood = [...placeholderMovies].sort((a, b) => {
  const aLingering = a.mainEmotion.includes("여운") ? 1 : 0;
  const bLingering = b.mainEmotion.includes("여운") ? 1 : 0;

  return bLingering - aLingering || b.impressionCount - a.impressionCount;
});

const rankingGroups = [
  {
    title: "인기 영화",
    description: "지금 가장 먼저 둘러보기 좋은 영화",
    movies: placeholderMovies,
  },
  {
    title: "감상 많이 남긴 영화",
    description: "한 줄 감상이 가장 많이 쌓인 영화",
    movies: moviesByImpressionCount,
  },
  {
    title: "여운이 오래 남은 영화",
    description: "오래 마음에 남는 감정으로 기억되는 영화",
    movies: moviesByLingeringMood,
  },
] as const;

export default function MoviesPage() {
  const hasMovies = placeholderMovies.length > 0;

  return (
    <main className="bg-[#12100f] text-[#fff7ea]">
      <PageContainer className="py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] lg:items-end">
          <SectionHeader
            eyebrow="영화 둘러보기"
            title="요즘 사람들의 마음에 남은 영화"
            description="지금 많이 이야기되는 영화와, 사람들이 어떤 감정으로 기억하고 있는지 둘러보세요."
            titleAs="h1"
          />

          <Card className="bg-[linear-gradient(145deg,rgba(240,161,95,0.16),rgba(244,199,216,0.08)_48%,rgba(255,247,234,0.06))]">
            <p className="text-sm font-medium text-[#f2b482]">오늘의 감상</p>
            <p className="mt-4 text-2xl font-semibold leading-9 text-[#fff7ea]">
              영화는 끝났지만, 감정은 아직 상영 중이에요.
            </p>
          </Card>
        </div>

        <section className="mt-12" aria-labelledby="movie-filters">
          <h2 id="movie-filters" className="text-sm font-medium text-[#f2b482]">
            감정으로 둘러보기
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {filterChips.map((chip) => (
              <EmotionTag
                as="span"
                key={chip.label}
                selected={chip.selected}
                tone={chip.tone}
              >
                {chip.label}
              </EmotionTag>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-4 lg:grid-cols-3">
          {rankingGroups.map((group) => (
            <Card key={group.title} className="p-5">
              <h2 className="text-lg font-semibold text-[#fff7ea]">
                {group.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#c9ad96]">
                {group.description}
              </p>
              <ol className="mt-5 space-y-3">
                {group.movies.slice(0, 3).map((movie, index) => (
                  <li
                    key={`${group.title}-${movie.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-[#fff7ea]/8 bg-[#12100f]/38 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#fff7ea]">
                        {index + 1}. {movie.title}
                      </p>
                      <p className="mt-1 text-sm text-[#c9ad96]">
                        감상 {movie.impressionCount.toLocaleString("ko-KR")}개
                      </p>
                    </div>
                    <EmotionTag as="span" tone={movie.emotionTone}>
                      {movie.mainEmotion}
                    </EmotionTag>
                  </li>
                ))}
              </ol>
            </Card>
          ))}
        </section>

        <section className="mt-16" aria-labelledby="movie-list">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="movie-list" className="text-2xl font-semibold text-[#fff7ea]">
                모든 영화
              </h2>
              <p className="mt-2 text-sm text-[#c9ad96]">
                지금은 MVP용 placeholder 데이터로 보여드려요.
              </p>
            </div>
            <p className="text-sm font-medium text-[#f2b482]">
              {placeholderMovies.length.toLocaleString("ko-KR")}편
            </p>
          </div>

          {hasMovies ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {placeholderMovies.map((movie) => (
                <Card
                  key={movie.id}
                  className="group flex h-full flex-col overflow-hidden p-0"
                >
                  <div className="aspect-[16/10] border-b border-[#fff7ea]/10 bg-[linear-gradient(135deg,rgba(240,161,95,0.22),rgba(244,199,216,0.12)_42%,rgba(200,182,255,0.08)_68%,rgba(18,16,15,0.86))] p-5">
                    <div className="flex h-full flex-col justify-between rounded-md border border-[#fff7ea]/10 bg-[#12100f]/30 p-4">
                      <p className="text-xs font-medium text-[#f2b482]">
                        남은 장면
                      </p>
                      <div>
                        <p className="text-2xl font-semibold text-[#fff7ea]">
                          {movie.title}
                        </p>
                        <p className="mt-1 text-sm text-[#e7d4c0]">
                          {movie.releaseYear}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-semibold text-[#fff7ea]">
                          {movie.title}
                        </h3>
                        <p className="mt-1 text-sm text-[#c9ad96]">
                          {movie.releaseYear} · {movie.genre}
                        </p>
                      </div>
                      <EmotionTag as="span" tone={movie.emotionTone}>
                        {movie.mainEmotion}
                      </EmotionTag>
                    </div>

                    <p className="mt-6 flex-1 text-base leading-7 text-[#e7d4c0]">
                      {movie.shortDescription}
                    </p>

                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm font-medium text-[#f2b482]">
                        감상 {movie.impressionCount.toLocaleString("ko-KR")}개
                      </span>
                      <ButtonLink
                        href={`/movies/${movie.slug}`}
                        className="px-4 py-2 text-sm"
                        variant="secondary"
                      >
                        자세히 보기
                      </ButtonLink>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mt-8 border-dashed bg-[#fff7ea]/5 text-center">
              <p className="text-lg font-semibold text-[#fff7ea]">
                아직 남겨진 영화가 없어요.
              </p>
              <p className="mt-3 text-sm leading-6 text-[#c9ad96]">
                영화 데이터가 준비되면 이곳에서 감정의 흐름을 둘러볼 수 있어요.
              </p>
            </Card>
          )}
        </section>
      </PageContainer>
    </main>
  );
}
