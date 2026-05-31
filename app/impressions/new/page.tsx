import {
  Button,
  Card,
  EmotionTag,
  PageContainer,
  SectionHeader,
} from "@/components/ui";
import { emotionOptions, placeholderMovies } from "@/lib/placeholder-data";

export default function NewImpressionPage() {
  return (
    <main className="bg-[#12100f] text-[#fff7ea]">
      <PageContainer className="py-16 sm:py-24">
        <SectionHeader
          eyebrow="감상 남기기"
          title="별점보다 먼저, 오늘 남은 감정을 기록해요."
          description="영화 제목과 감정, 짧은 한 줄만으로도 충분한 감상이 될 수 있어요."
        />

        <Card className="mt-10 max-w-3xl p-6 sm:p-8">
          <form className="space-y-8">
            <div>
              <label
                htmlFor="movie"
                className="text-sm font-medium text-[#f2b482]"
              >
                영화
              </label>
              <select
                id="movie"
                name="movie"
                defaultValue={placeholderMovies[0].id}
                className="mt-3 w-full rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 text-[#fff7ea] outline-none transition focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
              >
                {placeholderMovies.map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-[#f2b482]">
                마음에 남은 감정
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {emotionOptions.map((emotion, index) => (
                  <EmotionTag
                    as="span"
                    key={emotion.label}
                    selected={index === 0}
                    tone={emotion.tone}
                  >
                    {emotion.label}
                  </EmotionTag>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="impression"
                className="text-sm font-medium text-[#f2b482]"
              >
                한 줄 감상
              </label>
              <textarea
                id="impression"
                name="impression"
                rows={5}
                maxLength={80}
                placeholder="예: 엔딩 이후에도 음악이 계속 마음에 남았어요."
                className="mt-3 w-full resize-none rounded-lg border border-[#fff7ea]/12 bg-[#12100f] px-4 py-3 leading-7 text-[#fff7ea] outline-none transition placeholder:text-[#c9ad96]/70 focus:border-[#ffd3a3] focus:ring-2 focus:ring-[#ffd3a3]/30"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button>감상 저장하기</Button>
              <Button type="reset" variant="secondary">
                다시 쓰기
              </Button>
            </div>
          </form>
        </Card>
      </PageContainer>
    </main>
  );
}
