import {
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import { MovieBrowser } from "./movie-browser";
import { MovieSearch } from "./movie-search";

const filterChips = [
  { label: "전체", tone: "warm", selected: true },
  { label: "먹먹한", tone: "warm", selected: false },
  { label: "설레는", tone: "rose", selected: false },
  { label: "위로되는", tone: "violet", selected: false },
  { label: "통쾌한", tone: "warm", selected: false },
  { label: "찝찝한", tone: "violet", selected: false },
  { label: "여운 남는", tone: "warm", selected: false },
] as const;

export default function MoviesPage() {
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

        <MovieSearch />

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

        <MovieBrowser />
      </PageContainer>
    </main>
  );
}
