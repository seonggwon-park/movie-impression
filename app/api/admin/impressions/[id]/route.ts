import { adminErrorResponse, verifyAdminRequest } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AdminImpressionRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  request: Request,
  { params }: AdminImpressionRouteContext,
) {
  const adminCheck = await verifyAdminRequest(request);

  if (!adminCheck.ok) {
    return adminErrorResponse(adminCheck);
  }

  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { error: reportUpdateError } = await supabase
    .from("reports")
    .update({ status: "action_taken" })
    .eq("impression_id", id);

  if (reportUpdateError) {
    console.error("Admin related report status update failed", reportUpdateError);

    return Response.json(
      {
        message: `관련 신고 상태를 바꾸지 못했어요. ${reportUpdateError.message}`,
      },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("impressions")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Admin impression delete failed", error);

    return Response.json(
      { message: `감상을 삭제하지 못했어요. ${error.message}` },
      { status: 500 },
    );
  }

  if (!data) {
    return Response.json(
      { message: "삭제할 감상을 찾지 못했어요." },
      { status: 404 },
    );
  }

  return Response.json({ impression: data });
}
