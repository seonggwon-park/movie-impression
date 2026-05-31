import Link from "next/link";
import { Card, EmotionTag, PageContainer, SectionHeader } from "@/components/ui";
import { placeholderMovies } from "@/lib/placeholder-data";

export default function MoviesPage() {
  return (
    <main className="bg-[#12100f] text-[#fff7ea]">
      <PageContainer className="py-16 sm:py-24">
        <SectionHeader
          eyebrow="영화 둘러보기"
          title="지금 마음에 남겨지고 있는 영화들"
          description="평점보다 먼저, 사람들이 어떤 감정을 남겼는지 가볍게 살펴보세요."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {placeholderMovies.map((movie) => (
            <Card key={movie.id} className="flex h-full flex-col">
              <div>
                <p className="text-sm text-[#c9ad96]">
                  {movie.releaseYear} · {movie.genre}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-[#fff7ea]">
                  {movie.title}
                </h2>
              </div>

              <div className="mt-5">
                <EmotionTag as="span" tone={movie.emotionTone}>
                  {movie.mainEmotion}
                </EmotionTag>
              </div>

              <p className="mt-6 flex-1 text-base leading-7 text-[#e7d4c0]">
                {movie.shortDescription}
              </p>
              <div className="mt-8 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-[#f2b482]">
                  감상 {movie.impressionCount.toLocaleString("ko-KR")}개
                </span>
                <Link
                  href={`/movies/${movie.slug}`}
                  className="rounded-full px-3 py-2 font-medium text-[#fff7ea] transition hover:bg-[#fff7ea]/8 focus:outline-none focus:ring-2 focus:ring-[#ffd3a3] focus:ring-offset-2 focus:ring-offset-[#12100f]"
                >
                  자세히 보기
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
    </main>
  );
}
