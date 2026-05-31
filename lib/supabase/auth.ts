import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function upsertUserProfile(
  supabase: SupabaseClient,
  user: User,
) {
  const displayName = user.email?.split("@")[0] ?? "여운 사용자";

  return supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
    },
    { onConflict: "id" },
  );
}
