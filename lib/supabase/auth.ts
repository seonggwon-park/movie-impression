import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function upsertUserProfile(
  supabase: SupabaseClient,
  user: User,
) {
  const metadataDisplayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : "여운 사용자";
  const displayName = metadataDisplayName.trim() || "여운 사용자";

  return supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
    },
    { onConflict: "id" },
  );
}
