import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function Admin() {
  const [draws, setDraws] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [subscribers, setSubscribers] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch draws
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

  // 🔥 Users count
  const fetchUsersCount = async () => {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    setUsersCount(count || 0);
  };

  // 🔥 Subscribers + Revenue
  const fetchSubscribers = async () => {
    const { data } = await supabase.from("profiles").select("*");

    const activeUsers = data?.filter(
      (u) => u.subscription_status === "active"
    );

    const total = activeUsers?.length || 0;

    setSubscribers(total);
    setRevenue(total * 99);
  };

  // 🔥 FINAL ADMIN DRAW (FULL FIX)
  const runDraw = async () => {
    const drawNumbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    const { data: scores, error } = await supabase
      .from("scores")
      .select("*");

    console.log("SCORES ADMIN:", scores, error);

    // ❌ Error handling
    if (error) {
      alert("Error fetching scores ❌");
      return;
    }

    // ❌ Null check only (length check removed)
    if (!scores) {
      alert("No scores found ❌");
      return;
    }

    // 🔥 Group by user
    const userMap = {};
    scores.forEach((s) => {
      if (!userMap[s.user_id]) {
        userMap[s.user_id] = [];
      }
      userMap[s.user_id].push(s.score);
    });

    const validUsers = Object.keys(userMap).filter(
      (userId) => userMap[userId].length > 0
    );

    if (validUsers.length === 0) {
      alert("No valid users for draw ❌");
      return;
    }

    // 🔥 Process draw
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

    // 🔥 Refresh UI
    await new Promise((res) => setTimeout(res, 700));
    fetchDraws();
  };

  // 🔥 Check admin
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
// ✅ VERIFY WINNER
const verifyWinner = async (id, status) => {
  await supabase
    .from("draws")
    .update({
      verification_status: status,
      payment_status: status === "approved" ? "paid" : "rejected"
    })
    .eq("id", id);

  alert("Updated ✅");
  fetchDraws();
};
  // 🔥 Delete user data
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

  if (loading) {
    return <h1 className="text-center mt-10">Loading...</h1>;
  }

  if (!isAdmin) {
    return (
      <h1 className="text-center mt-10 text-red-500">
        Access Denied ❌
      </h1>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow">

        <h1 className="text-3xl font-bold mb-4">
          Admin Dashboard 🧑‍💻
        </h1>

        <button
          className="bg-purple-500 text-white px-4 py-2 rounded mb-4"
          onClick={runDraw}
        >
          Run Monthly Draw 🎯
        </button>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <div className="bg-blue-100 p-4 rounded">
            <h2 className="font-bold">Users</h2>
            <p className="text-2xl">{usersCount}</p>
          </div>

          <div className="bg-green-100 p-4 rounded">
            <h2 className="font-bold">Draws</h2>
            <p className="text-2xl">{draws.length}</p>
          </div>

          <div className="bg-purple-100 p-4 rounded">
            <h2 className="font-bold">Subscribers</h2>
            <p className="text-2xl">{subscribers}</p>
          </div>

          <div className="bg-yellow-100 p-4 rounded">
            <h2 className="font-bold">Revenue 💰</h2>
            <p className="text-2xl">₹{revenue}</p>
          </div>

        </div>

        <h2 className="font-bold mb-2">🎯 All Draws</h2>

        {draws.length === 0 ? (
          <p>No draws yet</p>
        ) : (
          <ul className="space-y-2">
            {draws.map((d) => (
              <li
                key={d.id}
                className="bg-gray-50 p-2 rounded flex justify-between"
              >
                <div>
  <span>
    🎯 {d.numbers} | Matches: {d.matches} | {d.result}
    <br />
    Status: {d.verification_status || "pending"}
  </span>

  <div className="mt-2">
    {d.proof_url && (
      <a href={d.proof_url} target="_blank" rel="noreferrer">
        View 📸
      </a>
    )}

    <button
      className="bg-green-500 text-white px-2 ml-2"
      onClick={() => verifyWinner(d.id, "approved")}
    >
      Approve
    </button>

    <button
      className="bg-red-500 text-white px-2 ml-2"
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