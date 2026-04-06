import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import toast from "react-hot-toast";

function Admin() {
  const [draws, setDraws] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [subscribers, setSubscribers] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [prizePool, setPrizePool] = useState(0);

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

    // ✅ FULL POOL (not 40%)
    setPrizePool(total * 99);
  };

  // ================= SIMULATION =================
  const simulateDraw = () => {
    const nums = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    toast(`Simulation: ${nums.join(", ")}`);
  };

  // ================= RUN DRAW =================
  const runDraw = async () => {
    const drawNumbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    const { data: drawsData } = await supabase.from("draws").select("*");

    if (!drawsData || drawsData.length === 0) {
      return toast.error("No participants ❌");
    }

    const { data: users } = await supabase.from("profiles").select("*");
    const activeUsers = users.filter(u => u.subscription_status === "active");

    const totalPool = activeUsers.length * 99;

    let winners5 = [];
    let winners4 = [];
    let winners3 = [];

    // 🔥 FIRST LOOP → FIND WINNERS
    for (let d of drawsData) {
      const userNumbers = d.numbers.split(",").map(Number);

      const matchCount = userNumbers.filter(n =>
        drawNumbers.includes(n)
      ).length;

      if (matchCount === 5) winners5.push(d);
      else if (matchCount === 4) winners4.push(d);
      else if (matchCount === 3) winners3.push(d);

      await supabase
        .from("draws")
        .update({ matches: matchCount })
        .eq("id", d.id);
    }

    // 🔥 CORRECT SPLIT
    const prize5 = Math.floor((totalPool * 0.4) / (winners5.length || 1));
    const prize4 = Math.floor((totalPool * 0.35) / (winners4.length || 1));
    const prize3 = Math.floor((totalPool * 0.25) / (winners3.length || 1));

    // 🔥 SECOND LOOP → UPDATE RESULTS
    for (let d of drawsData) {
      let result = "😢 No Win";
      let prize = 0;

      if (winners5.find(w => w.id === d.id)) {
        result = "🥇 Jackpot";
        prize = prize5;
      } else if (winners4.find(w => w.id === d.id)) {
        result = "🥈 4 Matches";
        prize = prize4;
      } else if (winners3.find(w => w.id === d.id)) {
        result = "🥉 3 Matches";
        prize = prize3;
      }

      await supabase
        .from("draws")
        .update({
          result: `${result} | Prize: ₹${prize}`,
        })
        .eq("id", d.id);
    }

    // 🔥 JACKPOT MESSAGE
    if (winners5.length === 0) {
      toast("No jackpot winner — rollover 🔁");
    }

    toast.success("Draw completed 🎯");
    fetchDraws();
    fetchSubscribers();
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

        {/* BUTTONS */}
        <div className="flex gap-3 mb-4">

          <button
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl shadow-lg"
            onClick={runDraw}
          >
            Run Monthly Draw 🎯
          </button>

          <button
            onClick={simulateDraw}
            className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
          >
            Simulate 🧪
          </button>

        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 text-white">

          <div className="bg-white/20 p-4 rounded">
            👤 Users
            <p className="text-xl font-bold">{usersCount}</p>
          </div>

          <div className="bg-white/20 p-4 rounded">
            🎯 Draws
            <p className="text-xl font-bold">{draws.length}</p>
          </div>

          <div className="bg-white/20 p-4 rounded">
            💎 Subscribers
            <p className="text-xl font-bold">{subscribers}</p>
          </div>

          <div className="bg-white/20 p-4 rounded">
            💰 Revenue
            <p className="text-xl font-bold">₹{revenue}</p>
          </div>

          <div className="bg-white/20 p-4 rounded">
            🏆 Prize Pool
            <p className="text-xl font-bold">₹{prizePool}</p>
          </div>

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
                Status:
                <span
                  className={
                    d.verification_status === "approved"
                      ? "text-green-400"
                      : d.verification_status === "rejected"
                      ? "text-red-400"
                      : "text-yellow-300"
                  }
                >
                  {d.verification_status || "pending"}
                </span>

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