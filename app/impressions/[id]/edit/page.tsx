import { AuthGuard } from "@/components/auth/auth-guard";
import { PageContainer, SectionHeader } from "@/components/ui";
import { EditImpressionForm } from "./edit-impression-form";

type EditImpressionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditImpressionPage({
  params,
}: EditImpressionPageProps) {
  const { id } = await params;

  return (
    <AuthGuard>
      <main className="bg-[#12100f] text-[#fff7ea]">
        <PageContainer className="py-16 sm:py-24">
          <SectionHeader
            eyebrow="감상 수정"
            title="마음에 남은 장면을 조금 다듬어볼까요."
            description="영화는 그대로 두고, 그때 남긴 감정과 문장만 편하게 고쳐보세요."
            titleAs="h1"
          />

          <EditImpressionForm impressionId={id} />
        </PageContainer>
      </main>
    </AuthGuard>
  );
}
