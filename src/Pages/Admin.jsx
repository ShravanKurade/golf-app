import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function Admin() {
  const [draws, setDraws] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [subscribers, setSubscribers] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // ================= FETCH DRAWS =================
  const fetchDraws = async () => {
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log("Draw fetch error:", error);
      return;
    }

    setDraws(data || []);
  };

  // ================= USERS COUNT =================
  const fetchUsersCount = async () => {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    setUsersCount(count || 0);
  };

  // ================= SUBSCRIBERS =================
  const fetchSubscribers = async () => {
    const { data } = await supabase.from("profiles").select("*");

    const activeUsers = data?.filter(
      (u) => u.subscription_status === "active"
    );

    const total = activeUsers?.length || 0;

    setSubscribers(total);
    setRevenue(total * 99);
  };

  // ================= RUN DRAW =================
  const runDraw = async () => {
    const drawNumbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    const { data: scores, error } = await supabase
      .from("scores")
      .select("*");

    if (error) return alert("Error fetching scores ❌");
    if (!scores) return alert("No scores found ❌");

    const userMap = {};
    scores.forEach((s) => {
      if (!userMap[s.user_id]) userMap[s.user_id] = [];
      userMap[s.user_id].push(s.score);
    });

    const validUsers = Object.keys(userMap).filter(
      (userId) => userMap[userId].length > 0
    );

    if (validUsers.length === 0)
      return alert("No valid users for draw ❌");

    for (let userId of validUsers) {
      const userNumbers = userMap[userId];

      let matchCount = 0;
      userNumbers.forEach((num) => {
        if (drawNumbers.includes(num)) matchCount++;
      });

      let result = "😢 No Win";
      let prize = "₹0";

      if (matchCount === 5) {
        result = "🥇 Jackpot";
        prize = "₹5000";
      } else if (matchCount === 4) {
        result = "🥈 4 Matches";
        prize = "₹2000";
      } else if (matchCount === 3) {
        result = "🥉 3 Matches";
        prize = "₹500";
      }

      await supabase.from("draws").insert([
        {
          user_id: userId,
          numbers: drawNumbers.join(", "),
          matches: matchCount,
          result: `${result} | Prize: ${prize}`,
        },
      ]);
    }

    alert("🎯 Monthly Draw Completed!");
    await new Promise((res) => setTimeout(res, 700));
    fetchDraws();
  };

  // ================= VERIFY WINNER =================
  const verifyWinner = async (id, status) => {
    await supabase
      .from("draws")
      .update({
        verification_status: status,
        payment_status: status === "approved" ? "paid" : "rejected",
      })
      .eq("id", id);

    alert("Updated ✅");
    fetchDraws();
  };

  // ================= DELETE =================
  const deleteUserData = async (user_id) => {
    if (!window.confirm("Delete this user's data?")) return;

    await Promise.all([
      supabase.from("scores").delete().eq("user_id", user_id),
      supabase.from("draws").delete().eq("user_id", user_id),
    ]);

    alert("User data deleted ✅");

    fetchDraws();
    fetchUsersCount();
    fetchSubscribers();
  };

  // ================= ADMIN CHECK =================
  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

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
    } else {
      setIsAdmin(false);
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

      <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20">

        <h1 className="text-3xl font-bold mb-4 text-white">
          🧑‍💻 Admin Dashboard
        </h1>

        <button
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl shadow-lg hover:scale-105 hover:shadow-pink-500/50 transition transform mb-4"
          onClick={runDraw}
        >
          Run Monthly Draw 🎯
        </button>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-white">

          <div className="bg-white/20 p-4 rounded">
            <h2 className="font-bold">Users</h2>
            <p className="text-2xl">{usersCount}</p>
          </div>

          <div className="bg-white/20 p-4 rounded">
            <h2 className="font-bold">Draws</h2>
            <p className="text-2xl">{draws.length}</p>
          </div>

          <div className="bg-white/20 p-4 rounded">
            <h2 className="font-bold">Subscribers</h2>
            <p className="text-2xl">{subscribers}</p>
          </div>

          <div className="bg-white/20 p-4 rounded">
            <h2 className="font-bold">Revenue 💰</h2>
            <p className="text-2xl">₹{revenue}</p>
          </div>

        </div>

        {/* DRAWS */}
        <h2 className="font-bold mb-2 text-white">🎯 All Draws</h2>

        {draws.length === 0 ? (
          <p className="text-white">No draws yet</p>
        ) : (
          <ul className="space-y-2">
            {draws.map((d) => (
              <li
                key={d.id}
                className="bg-white/20 text-white p-3 rounded flex justify-between"
              >
                <div>
                  🎯 {d.numbers} | Matches: {d.matches} | {d.result}
                  <br />
                  Status: {d.verification_status || "pending"}

                  <div className="mt-2">

                    {d.proof_url && (
                      <a href={d.proof_url} target="_blank" rel="noreferrer">
                        View 📸
                      </a>
                    )}

                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded ml-2"
                      onClick={() => verifyWinner(d.id, "approved")}
                    >
                      Approve
                    </button>

                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded ml-2"
                      onClick={() => verifyWinner(d.id, "rejected")}
                    >
                      Reject
                    </button>

                  </div>
                </div>

                <button
                  className="bg-red-500 text-white px-3 py-1 rounded"
                  onClick={() => deleteUserData(d.user_id)}
                >
                  Delete ❌
                </button>

              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
}

export default Admin;