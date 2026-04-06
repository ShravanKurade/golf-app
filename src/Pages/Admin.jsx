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

  // 🔥 NEW
  const [users, setUsers] = useState([]);
  const [charities, setCharities] = useState([]);

  const [newCharity, setNewCharity] = useState("");
  const [charityDesc, setCharityDesc] = useState("");
  const [charityImage, setCharityImage] = useState("");

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

    // 🔥 jackpot include
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    const jackpot = settings?.jackpot_pool || 0;

    setPrizePool(total * 99 + jackpot);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*");
    setUsers(data || []);
  };

  const fetchCharities = async () => {
    const { data } = await supabase.from("charities").select("*");
    setCharities(data || []);
  };

  // ================= ROLE =================
  const toggleRole = async (id, role) => {
    await supabase
      .from("profiles")
      .update({
        role: role === "admin" ? "user" : "admin",
      })
      .eq("id", id);

    toast.success("Role updated ✅");
    fetchUsers();
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

    // 🔥 jackpot fetch
    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    let jackpot = settings?.jackpot_pool || 0;

    const totalPool = activeUsers.length * 99 + jackpot;

    let winners5 = [];

    for (let d of drawsData) {
      const userNumbers = d.numbers.split(",").map(Number);

      const matchCount = userNumbers.filter(n =>
        drawNumbers.includes(n)
      ).length;

      let result = "😢 No Win";
      let prize = 0;

      if (matchCount === 5) {
        result = "🥇 Jackpot";
        prize = Math.floor(totalPool * 0.4);
        winners5.push(d);
      } else if (matchCount === 4) {
        result = "🥈 4 Matches";
        prize = Math.floor(totalPool * 0.35);
      } else if (matchCount === 3) {
        result = "🥉 3 Matches";
        prize = Math.floor(totalPool * 0.25);
      }

      await supabase
        .from("draws")
        .update({
          matches: matchCount,
          result: `${result} | Prize: ₹${prize}`,
        })
        .eq("id", d.id);
    }

    // 🔥 jackpot rollover
    if (winners5.length === 0) {
      await supabase
        .from("settings")
        .upsert({ id: 1, jackpot_pool: totalPool });

      toast("No jackpot winner — rollover 🔁");
    } else {
      await supabase
        .from("settings")
        .upsert({ id: 1, jackpot_pool: 0 });
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
        fetchUsers(),
        fetchCharities(),
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

      <motion.div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-lg p-6 rounded-2xl">

        <h1 className="text-3xl font-bold text-white mb-4">
          🧑‍💻 Admin Dashboard
        </h1>

        <div className="flex gap-3 mb-4">
          <button onClick={runDraw} className="bg-pink-500 px-4 py-2 rounded text-white">
            Run Monthly Draw 🎯
          </button>

          <button onClick={simulateDraw} className="bg-yellow-500 px-4 py-2 rounded text-white">
            Simulate 🧪
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-white mb-6">
          <div className="bg-white/20 p-3 rounded">Users: {usersCount}</div>
          <div className="bg-white/20 p-3 rounded">Draws: {draws.length}</div>
          <div className="bg-white/20 p-3 rounded">Subscribers: {subscribers}</div>
          <div className="bg-white/20 p-3 rounded">Revenue: ₹{revenue}</div>
          <div className="bg-white/20 p-3 rounded">Pool: ₹{prizePool}</div>
        </div>

        {/* USERS */}
        <h2 className="text-white mt-6">Users</h2>
        {users.map(u => (
          <div key={u.id} className="bg-white/20 p-2 mb-2 text-white flex justify-between">
            {u.id.slice(0,6)} | {u.role}
            <button onClick={() => toggleRole(u.id, u.role)}>Toggle Role</button>
          </div>
        ))}

        {/* CHARITIES */}
        <h2 className="text-white mt-6">Charities</h2>

        <input value={newCharity} onChange={(e)=>setNewCharity(e.target.value)} placeholder="Name" className="p-2 m-1 rounded"/>
        <input value={charityDesc} onChange={(e)=>setCharityDesc(e.target.value)} placeholder="Description" className="p-2 m-1 rounded"/>
        <input value={charityImage} onChange={(e)=>setCharityImage(e.target.value)} placeholder="Image URL" className="p-2 m-1 rounded"/>

        <button onClick={async () => {
          await supabase.from("charities").insert([{
            name: newCharity,
            description: charityDesc,
            image_url: charityImage
          }]);
          setNewCharity(""); setCharityDesc(""); setCharityImage("");
          fetchCharities();
        }} className="bg-blue-500 px-3 py-1 text-white rounded">Add</button>

      </motion.div>
    </div>
  );
}

export default Admin;