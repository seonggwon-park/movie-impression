import Image from "next/image";
import {
  ButtonLink,
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import { emotionOptions } from "@/lib/emotions";

const impressionPrinciples = [
  {
    title: "감정으로 남기는 영화 기록",
    description:
      "영화를 점수로 정리하기 전에, 그날 마음에 남은 감정부터 골라요.",
  },
  {
    title: "한 줄만 남겨도 괜찮아요",
    description:
      "긴 글을 쓰지 않아도 괜찮아요. 떠오르는 장면과 마음 한 문장이면 충분해요.",
  },
  {
    title: "내가 본 영화의 여운을 모아보세요",
    description:
      "시간이 지나도 다시 꺼내 보고 싶은 감상들을 나만의 작은 아카이브로 쌓아요.",
  },
] as const;

const archiveSteps = [
  {
    title: "영화를 찾고",
    description: "영화 제목을 검색해 오늘 남은 감상의 자리를 만들어요.",
  },
  {
    title: "감정을 고르고",
    description: "먹먹함, 설렘, 위로됨처럼 마음에 가까운 단어를 선택해요.",
  },
  {
    title: "감상을 남겨요",
    description: "한 줄 감상과 기억하고 싶은 장면을 가볍게 남겨요.",
  },
] as const;

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
          eyebrow="여운을 남기는 방식"
          title="진짜 감상이 쌓이기 전에도, 이곳의 방향은 분명해요."
          description="여운은 영화 데이터를 채우는 곳보다, 영화를 본 뒤 남은 마음을 조용히 보관하는 공간에 가까워요."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {impressionPrinciples.map((item) => (
            <Card key={item.title} className="flex h-full flex-col">
              <h3 className="text-2xl font-semibold leading-tight text-[#fff7ea]">
                {item.title}
              </h3>
              <p className="mt-6 flex-1 text-base leading-7 text-[#e7d4c0]">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </PageContainer>

      <PageContainer className="py-20 sm:py-24">
        <SectionHeader
          eyebrow="기록 흐름"
          title="영화를 찾고, 감정을 고르고, 한 줄을 남겨요."
          description="아직 감상이 없다면 비어 있는 상태 그대로 두고, 첫 기록이 쌓이기를 기다려요."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {archiveSteps.map((step) => (
            <Card key={step.title} className="flex h-full flex-col">
              <p className="text-sm font-medium text-[#f2b482]">남은 장면</p>
              <h3 className="mt-4 text-2xl font-semibold text-[#fff7ea]">
                {step.title}
              </h3>
              <p className="mt-5 flex-1 text-base leading-7 text-[#e7d4c0]">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </PageContainer>

      <PageContainer className="pb-24 pt-16 sm:pb-32">
        <Card className="bg-[#fff7ea]/10 p-8 sm:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-2xl text-2xl font-semibold leading-10 text-[#fff7ea]">
              긴 글이 아니어도 괜찮아요. 오늘 마음에 남은 감정 하나만
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
