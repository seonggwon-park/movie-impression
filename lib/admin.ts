import type { User } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/lib/supabase";

type AdminCheckSuccess = {
  ok: true;
  user: User;
};

type AdminCheckFailure = {
  ok: false;
  status: 401 | 403 | 500;
  message: string;
};

export type AdminCheckResult = AdminCheckSuccess | AdminCheckFailure;

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function verifyAdminRequest(
  request: Request,
): Promise<AdminCheckResult> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      message: "로그인 후 이용할 수 있어요.",
    };
  }

  const supabase = createSupabaseClient();
  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    if (userError) {
      console.error("Admin auth verification failed", userError);
    }

    return {
      ok: false,
      status: 401,
      message: "로그인 후 이용할 수 있어요.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Admin profile lookup failed", profileError);

    return {
      ok: false,
      status: 500,
      message: "관리자 권한을 확인하지 못했어요.",
    };
  }

  if (profile?.role !== "admin") {
    return {
      ok: false,
      status: 403,
      message: "관리자만 접근할 수 있어요.",
    };
  }

  return {
    ok: true,
    user: userData.user,
  };
}

export function adminErrorResponse(result: AdminCheckFailure) {
  return Response.json({ message: result.message }, { status: result.status });
}
