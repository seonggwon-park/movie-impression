import { adminErrorResponse, verifyAdminRequest } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminCheck = await verifyAdminRequest(request);

  if (!adminCheck.ok) {
    return adminErrorResponse(adminCheck);
  }

  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    console.error("Admin pending report count failed", error);

    return Response.json(
      { message: `대기 중인 신고 수를 불러오지 못했어요. ${error.message}` },
      { status: 500 },
    );
  }

  return Response.json({ pendingCount: count ?? 0 });
}
