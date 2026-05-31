import { AuthGuard } from "@/components/auth/auth-guard";
import { MyArchive } from "./my-archive";

export default function MyPage() {
  return (
    <AuthGuard>
      <MyArchive />
    </AuthGuard>
  );
}
