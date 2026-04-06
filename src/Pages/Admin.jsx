import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import toast from "react-hot-toast";

function Admin() {
  const [draws, setDraws] = useState([]);
  const [users, setUsers] = useState([]);
  const [charities, setCharities] = useState([]);

  const [usersCount, setUsersCount] = useState(0);
  const [subscribers, setSubscribers] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [prizePool, setPrizePool] = useState(0);

  const [newCharity, setNewCharity] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // ================= FETCH =================
  const fetchAll = async () => {
    const { data: drawsData } = await supabase.from("draws").select("*");
    const { data: usersData } = await supabase.from("profiles").select("*");
    const { data: charityData } = await supabase.from("charities").select("*");

    setDraws(drawsData || []);
    setUsers(usersData || []);
    setCharities(charityData || []);

    const active = usersData.filter(u => u.subscription_status === "active");

    setUsersCount(usersData.length);
    setSubscribers(active.length);
    setRevenue(active.length * 99);

    const totalPool = active.length * 99;
    setPrizePool(totalPool);
  };

  // ================= SIMULATION =================
  const simulateDraw = () => {
    const numbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    toast(`Simulation: ${numbers.join(", ")}`);
  };

  // ================= RUN DRAW =================
  const runDraw = async () => {
    const drawNumbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    const activeUsers = users.filter(
      u => u.subscription_status === "active"
    );

    const totalPool = activeUsers.length * 99;

    const { data: drawsData } = await supabase.from("draws").select("*");

    if (!drawsData || drawsData.length === 0) {
      return toast.error("No participants ❌");
    }

    let winners5 = [];
    let winners4 = [];
    let winners3 = [];

    // MATCH CALCULATION
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

    // 💰 DYNAMIC SPLIT
    const prize5 = Math.floor((totalPool * 0.4) / (winners5.length || 1));
    const prize4 = Math.floor((totalPool * 0.35) / (winners4.length || 1));
    const prize3 = Math.floor((totalPool * 0.25) / (winners3.length || 1));

    // RESULT UPDATE
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

    // Jackpot fallback
    if (winners5.length === 0) {
      toast("No jackpot winner — rollover 🔁");
    }

    toast.success("Draw Completed 🎯");
    fetchAll();
  };

  // ================= EDIT USER =================
  const toggleSubscription = async (id, status) => {
    await supabase
      .from("profiles")
      .update({
        subscription_status: status === "active" ? "inactive" : "active",
      })
      .eq("id", id);

    fetchAll();
  };

  // ================= CHARITY =================
  const addCharity = async () => {
    if (!newCharity) return;

    await supabase.from("charities").insert([{ name: newCharity }]);
    setNewCharity("");
    fetchAll();
  };

  const deleteCharity = async (id) => {
    await supabase.from("charities").delete().eq("id", id);
    fetchAll();
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
      await fetchAll();
    }

    setLoading(false);
  };

  useEffect(() => {
    checkAdmin();
  }, []);

  if (loading) return <h1 className="text-center mt-10">Loading...</h1>;

  if (!isAdmin)
    return <h1 className="text-center mt-10 text-red-500">Access Denied ❌</h1>;

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

      <motion.div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-lg p-6 rounded-2xl">

        <h1 className="text-3xl text-white mb-4">Admin Panel 🧑‍💻</h1>

        {/* BUTTONS */}
        <div className="flex gap-3 mb-4">
          <button onClick={runDraw} className="bg-green-500 px-4 py-2 rounded text-white">
            Run Draw 🎯
          </button>

          <button onClick={simulateDraw} className="bg-yellow-500 px-4 py-2 rounded text-white">
            Simulate 🧪
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-white mb-6">
          <div className="bg-white/20 p-3 rounded">Users: {usersCount}</div>
          <div className="bg-white/20 p-3 rounded">Subscribers: {subscribers}</div>
          <div className="bg-white/20 p-3 rounded">Revenue: ₹{revenue}</div>
          <div className="bg-white/20 p-3 rounded">Pool: ₹{prizePool}</div>
          <div className="bg-white/20 p-3 rounded">Draws: {draws.length}</div>
        </div>

        {/* USERS */}
        <h2 className="text-white mb-2">Users</h2>
        {users.map(u => (
          <div key={u.id} className="bg-white/20 p-2 mb-2 text-white flex justify-between">
            {u.id.slice(0, 6)} | {u.subscription_status}
            <button onClick={() => toggleSubscription(u.id, u.subscription_status)}>
              Toggle
            </button>
          </div>
        ))}

        {/* CHARITY */}
        <h2 className="text-white mt-6">Charities</h2>

        <div className="flex gap-2 mb-2">
          <input
            value={newCharity}
            onChange={(e) => setNewCharity(e.target.value)}
            className="p-2 rounded"
            placeholder="Add charity"
          />
          <button onClick={addCharity} className="bg-blue-500 px-3 rounded text-white">
            Add
          </button>
        </div>

        {charities.map(c => (
          <div key={c.id} className="bg-white/20 p-2 mb-2 text-white flex justify-between">
            {c.name}
            <button onClick={() => deleteCharity(c.id)}>Delete</button>
          </div>
        ))}

        {/* DRAWS */}
        <h2 className="text-white mt-6">Draw Results</h2>
        {draws.map((d) => (
          <div key={d.id} className="bg-white/20 p-2 mt-2 text-white rounded">
            🎯 {d.numbers} | {d.result}
          </div>
        ))}

      </motion.div>
    </div>
  );
}

export default Admin;