import { adminErrorResponse, verifyAdminRequest } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const allowedStatuses = new Set(["reviewed", "dismissed", "action_taken"]);

type ReportStatusPayload = {
  status?: unknown;
};

type AdminReportRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: AdminReportRouteContext,
) {
  const adminCheck = await verifyAdminRequest(request);

  if (!adminCheck.ok) {
    return adminErrorResponse(adminCheck);
  }

  const { id } = await params;
  const payload = (await request.json()) as ReportStatusPayload;
  const status = typeof payload.status === "string" ? payload.status : "";

  if (!allowedStatuses.has(status)) {
    return Response.json(
      { message: "변경할 신고 상태를 확인해주세요." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", id)
    .select("id, status")
    .maybeSingle();

  if (error) {
    console.error("Admin report status update failed", error);

    return Response.json(
      { message: `신고 상태를 바꾸지 못했어요. ${error.message}` },
      { status: 500 },
    );
  }

  if (!data) {
    return Response.json(
      { message: "신고를 찾지 못했어요." },
      { status: 404 },
    );
  }

  return Response.json({ report: data });
}
