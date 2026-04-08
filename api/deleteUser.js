import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID required" });
  }

  try {
    // 🔥 DELETE RELATED DATA FIRST
    await supabase.from("draws").delete().eq("user_id", userId);
    await supabase.from("scores").delete().eq("user_id", userId);

    // 🔥 DELETE FROM AUTH
    const { error: authError } =
      await supabase.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    // 🔥 DELETE FROM PROFILES
    const { error: dbError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (dbError) throw dbError;

    return res.status(200).json({
      message: "User deleted fully 💀🔥",
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
}