import { adminErrorResponse, verifyAdminRequest } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const adminCheck = await verifyAdminRequest(request);

  if (!adminCheck.ok) {
    return adminErrorResponse(adminCheck);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reports")
    .select(
      `
      id,
      reason,
      detail,
      status,
      created_at,
      impressions (
        id,
        one_line,
        note,
        created_at,
        movies (
          id,
          title,
          slug
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin reports load failed", error);

    return Response.json(
      { message: `신고 목록을 불러오지 못했어요. ${error.message}` },
      { status: 500 },
    );
  }

  return Response.json({ reports: data ?? [] });
}
