import Image from "next/image";
import {
  ButtonLink,
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import {
  emotionOptions,
  featuredImpressions,
  placeholderMovies,
} from "@/lib/placeholder-data";

const popularMovies = placeholderMovies.slice(0, 3);

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#12100f] text-[#fff7ea]">
      <section className="relative isolate min-h-svh overflow-hidden">
        <Image
          src="/home-cinema.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(18,16,15,0.96)_0%,rgba(18,16,15,0.86)_36%,rgba(18,16,15,0.48)_68%,rgba(18,16,15,0.18)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(19,18,25,0.2)_0%,rgba(18,16,15,0.44)_75%,rgba(18,16,15,0.92)_100%)]" />

        <PageContainer className="flex min-h-svh items-center py-16">
          <div className="w-full max-w-3xl">
            <SectionHeader
              eyebrow="여운"
              title="영화가 끝난 뒤, 마음에 남은 장면을 기록하세요."
              description="별점보다 먼저, 당신에게 남은 감정을 남겨보세요."
              titleAs="h1"
              variant="hero"
            />

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/impressions/new">감상 남기기</ButtonLink>
              <ButtonLink href="/movies" variant="secondary">
                요즘 영화 보기
              </ButtonLink>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageContainer className="py-20 sm:py-24">
        <SectionHeader
          eyebrow="마음에 남은 감정"
          title="영화를 설명하기 전에, 먼저 감정을 골라보세요."
          description="평론처럼 완벽하지 않아도 괜찮아요. 그날의 마음에 가까운 단어 하나면 충분해요."
        />

        <div className="mt-10 flex flex-wrap gap-3">
          {emotionOptions.map((emotion) => (
            <EmotionTag as="span" key={emotion.label} tone={emotion.tone}>
              {emotion.label}
            </EmotionTag>
          ))}
        </div>
      </PageContainer>

      <PageContainer className="py-20 sm:py-24">
        <SectionHeader
          eyebrow="남겨진 감상"
          title="긴 리뷰 대신, 마음에 남은 한 줄을 모아요."
          description="좋았다, 별로였다보다 조금 더 개인적인 감상의 조각들."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {featuredImpressions.map((item) => (
            <Card key={item.movieTitle} className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-semibold text-[#fff7ea]">
                  {item.movieTitle}
                </h3>
                <EmotionTag as="span" className="shrink-0" tone="warm">
                  {item.emotion}
                </EmotionTag>
              </div>
              <p className="mt-8 text-lg leading-8 text-[#f1ddc9]">
                “{item.impression}”
              </p>
            </Card>
          ))}
        </div>
      </PageContainer>

      <PageContainer className="py-20 sm:py-24">
        <SectionHeader
          eyebrow="요즘 남겨진 영화"
          title="지금 사람들의 마음에 남아 있는 영화들"
          description="극장 밖으로 이어진 감정의 흐름을 가볍게 둘러보세요."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {popularMovies.map((movie) => (
            <Card key={movie.title} className="flex h-full flex-col">
              <div>
                <p className="text-sm text-[#c9ad96]">{movie.releaseYear}</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#fff7ea]">
                  {movie.title}
                </h3>
              </div>
              <div className="mt-5">
                <EmotionTag as="span" tone={movie.emotionTone}>
                  {movie.mainEmotion}
                </EmotionTag>
              </div>
              <p className="mt-6 flex-1 text-base leading-7 text-[#e7d4c0]">
                {movie.shortDescription}
              </p>
              <p className="mt-8 text-sm font-medium text-[#f2b482]">
                감상 {movie.impressionCount.toLocaleString("ko-KR")}개
              </p>
            </Card>
          ))}
        </div>
      </PageContainer>

      <PageContainer className="pb-24 pt-16 sm:pb-32">
        <Card className="bg-[#fff7ea]/10 p-8 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-2xl text-2xl font-semibold leading-10 text-[#fff7ea]">
              긴 리뷰가 아니어도 괜찮아요. 오늘 마음에 남은 감정 하나만
              남겨보세요.
            </p>
            <ButtonLink href="/impressions/new" className="w-full sm:w-auto">
              첫 감상 남기기
            </ButtonLink>
          </div>
        </Card>
      </PageContainer>
    </main>
  );
}
