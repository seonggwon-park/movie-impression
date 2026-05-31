import { AuthGuard } from "@/components/auth/auth-guard";
import { PageContainer, SectionHeader } from "@/components/ui";
import { ImpressionForm } from "./impression-form";

export default function NewImpressionPage() {
  return (
    <AuthGuard>
      <main className="bg-[#12100f] text-[#fff7ea]">
        <PageContainer className="py-16 sm:py-24">
          <SectionHeader
            eyebrow="감상 남기기"
            title="별점보다 먼저, 오늘 남은 감정을 기록해요."
            description="길게 쓰지 않아도 괜찮아요. 마음에 남은 감정과 한 줄이면 충분해요."
          />

          <ImpressionForm />
        </PageContainer>
      </main>
    </AuthGuard>
  );
}
