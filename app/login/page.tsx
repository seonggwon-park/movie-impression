import { PageContainer, SectionHeader } from "@/components/ui";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="bg-[#12100f] text-[#fff7ea]">
      <PageContainer className="py-16 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)] lg:items-start">
          <SectionHeader
            eyebrow="로그인"
            title="나의 여운을 이어서 기록하세요."
            description="영화가 끝난 뒤 남은 감정을 조용히 모아둘 수 있도록, 이메일로 간단히 시작해요."
            titleAs="h1"
          />

          <LoginForm />
        </div>
      </PageContainer>
    </main>
  );
}
