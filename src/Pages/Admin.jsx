import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import toast from "react-hot-toast";

function Admin() {
  const [draws, setDraws] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [subscribers, setSubscribers] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // ================= FETCH =================
  const fetchDraws = async () => {
    const { data } = await supabase
      .from("draws")
      .select("*")
      .order("id", { ascending: false });

    setDraws(data || []);
  };

  const fetchUsersCount = async () => {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    setUsersCount(count || 0);
  };

  const fetchSubscribers = async () => {
    const { data } = await supabase.from("profiles").select("*");

    const activeUsers = data?.filter(
      (u) => u.subscription_status === "active"
    );

    const total = activeUsers?.length || 0;

    setSubscribers(total);
    setRevenue(total * 99);
  };

  // ================= RUN DRAW (FIXED 🔥) =================
  const runDraw = async () => {
    const drawNumbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    const { data: drawsData } = await supabase
      .from("draws")
      .select("*");

    if (!drawsData || drawsData.length === 0) {
      return toast.error("No participants ❌");
    }

    for (let d of drawsData) {
      if (d.result !== "Waiting for draw ⏳") continue;

      const userNumbers = d.numbers.split(",").map(Number);

      const matchCount = userNumbers.filter((n) =>
        drawNumbers.includes(n)
      ).length;

      let result = "😢 No Win";

      if (matchCount === 5) result = "🥇 Jackpot";
      else if (matchCount === 4) result = "🥈 4 Matches";
      else if (matchCount === 3) result = "🥉 3 Matches";

      await supabase
        .from("draws")
        .update({
          matches: matchCount,
          result: result,
        })
        .eq("id", d.id);
    }

    toast.success("Monthly draw completed 🎯");
    fetchDraws();
  };

  // ================= VERIFY =================
  const verifyWinner = async (id, status) => {
    await supabase
      .from("draws")
      .update({
        verification_status: status,
        payment_status: status === "approved" ? "paid" : "rejected",
      })
      .eq("id", id);

    toast.success("Updated ✅");
    fetchDraws();
  };

  // ================= DELETE =================
  const deleteUserData = async (user_id) => {
    if (!window.confirm("Delete user data?")) return;

    await Promise.all([
      supabase.from("scores").delete().eq("user_id", user_id),
      supabase.from("draws").delete().eq("user_id", user_id),
    ]);

    toast.success("Deleted ❌");
    fetchDraws();
    fetchUsersCount();
    fetchSubscribers();
  };

  // ================= ADMIN CHECK =================
  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (data?.role === "admin") {
      setIsAdmin(true);

      await Promise.all([
        fetchDraws(),
        fetchUsersCount(),
        fetchSubscribers(),
      ]);
    }

    setLoading(false);
  };

  useEffect(() => {
    checkAdmin();
  }, []);

  if (loading) return <h1 className="text-center mt-10">Loading...</h1>;

  if (!isAdmin)
    return (
      <h1 className="text-center mt-10 text-red-500">
        Access Denied ❌
      </h1>
    );

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20"
      >

        <h1 className="text-3xl font-bold text-white mb-4">
          🧑‍💻 Admin Dashboard
        </h1>

        <button
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl shadow-lg hover:scale-105 hover:shadow-pink-500/50 transition mb-4"
          onClick={runDraw}
        >
          Run Monthly Draw 🎯
        </button>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">
          <div className="bg-white/20 p-4 rounded">Users: {usersCount}</div>
          <div className="bg-white/20 p-4 rounded">Draws: {draws.length}</div>
          <div className="bg-white/20 p-4 rounded">Subscribers: {subscribers}</div>
          <div className="bg-white/20 p-4 rounded">₹{revenue}</div>
        </div>

        {/* DRAWS */}
        <ul className="space-y-2">
          {draws.map((d) => (
            <li
              key={d.id}
              className="bg-white/20 text-white p-3 rounded flex justify-between"
            >
              <div>
                🎯 {d.numbers} | Matches: {d.matches}
                <br />
                Status: {d.verification_status || "pending"}

                <div className="mt-2">
                  {d.proof_url && (
                    <a href={d.proof_url} target="_blank" rel="noreferrer">
                      📸 View
                    </a>
                  )}

                  <button
                    className="bg-green-500 px-2 ml-2 rounded"
                    onClick={() => verifyWinner(d.id, "approved")}
                  >
                    Approve
                  </button>

                  <button
                    className="bg-red-500 px-2 ml-2 rounded"
                    onClick={() => verifyWinner(d.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <button
                className="bg-red-500 px-2 rounded"
                onClick={() => deleteUserData(d.user_id)}
              >
                Delete ❌
              </button>
            </li>
          ))}
        </ul>

      </motion.div>
    </div>
  );
}

export default Admin;