import {
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import { myImpressions } from "@/lib/placeholder-data";

export default function MyPage() {
  return (
    <main className="bg-[#12100f] text-[#fff7ea]">
      <PageContainer className="py-16 sm:py-24">
        <SectionHeader
          eyebrow="나의 여운"
          title="내가 남겨둔 영화의 감정들"
          description="짧게 적어둔 감상이 시간이 지나 다시 꺼내볼 수 있는 장면이 돼요."
        />

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {myImpressions.map((impression) => (
            <Card key={impression.id} className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#c9ad96]">
                    {impression.watchedAt}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#fff7ea]">
                    {impression.movieTitle}
                  </h2>
                </div>
                <EmotionTag as="span" className="shrink-0" tone="warm">
                  {impression.emotion}
                </EmotionTag>
              </div>

              <p className="mt-8 flex-1 text-lg leading-8 text-[#f1ddc9]">
                “{impression.note}”
              </p>
            </Card>
          ))}
        </div>
      </PageContainer>
    </main>
  );
}
