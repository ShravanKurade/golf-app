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

    const activeUsers = (data || []).filter(
      (u) => u.subscription_status === "active"
    );

    const total = activeUsers.length;

    setSubscribers(total);
    setRevenue(total * 99);
    setPrizePool(total * 99);
  };

  // 🔥 NEW
  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*");
    setUsers(data || []);
  };

  const fetchCharities = async () => {
    const { data } = await supabase.from("charities").select("*");
    setCharities(data || []);
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

    const { data: usersData } = await supabase.from("profiles").select("*");

    const activeUsers = (usersData || []).filter(
      (u) => u.subscription_status === "active"
    );

    const totalPool = activeUsers.length * 99;

    let winners5 = [];
    let winners4 = [];
    let winners3 = [];

    for (let d of drawsData) {
      const userNumbers = (d.numbers || "")
        .split(",")
        .map((n) => Number(n.trim()));

      const matchCount = userNumbers.filter((n) =>
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

    const prize5 = Math.floor((totalPool * 0.4) / (winners5.length || 1));
    const prize4 = Math.floor((totalPool * 0.35) / (winners4.length || 1));
    const prize3 = Math.floor((totalPool * 0.25) / (winners3.length || 1));

    for (let d of drawsData) {
      let result = "😢 No Win";
      let prize = 0;

      if (winners5.some((w) => w.id === d.id)) {
        result = "🥇 Jackpot";
        prize = prize5;
      } else if (winners4.some((w) => w.id === d.id)) {
        result = "🥈 4 Matches";
        prize = prize4;
      } else if (winners3.some((w) => w.id === d.id)) {
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

    if (winners5.length === 0) {
      toast("No jackpot winner — rollover 🔁");
    }

    toast.success("Draw completed 🎯");

    fetchDraws();
    fetchSubscribers();
  };

  // ================= ROLE EDIT =================
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
    return <h1 className="text-center mt-10 text-red-500">Access Denied ❌</h1>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

      <motion.div className="max-w-5xl mx-auto bg-white/10 p-6 rounded-2xl">

        <h1 className="text-3xl text-white mb-4">🧑‍💻 Admin Dashboard</h1>

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
        <h2 className="text-white mt-4">Users</h2>
        {users.map((u) => (
          <div key={u.id} className="bg-white/20 p-2 mb-2 text-white flex justify-between">
            {u.id.slice(0, 6)} | {u.role}
            <button onClick={() => toggleRole(u.id, u.role)}>
              Toggle
            </button>
          </div>
        ))}

        {/* CHARITY */}
        <h2 className="text-white mt-6">Charities</h2>

        <input value={newCharity} onChange={(e)=>setNewCharity(e.target.value)} placeholder="Name" className="p-2 m-1 rounded" />
        <input value={charityDesc} onChange={(e)=>setCharityDesc(e.target.value)} placeholder="Description" className="p-2 m-1 rounded" />
        <input value={charityImage} onChange={(e)=>setCharityImage(e.target.value)} placeholder="Image URL" className="p-2 m-1 rounded" />

        <button
          onClick={async () => {
            await supabase.from("charities").insert([{
              name: newCharity,
              description: charityDesc,
              image_url: charityImage
            }]);

            setNewCharity("");
            setCharityDesc("");
            setCharityImage("");

            fetchCharities();
          }}
          className="bg-blue-500 px-3 py-1 text-white rounded"
        >
          Add
        </button>

        {charities.map((c) => (
          <div key={c.id} className="bg-white/20 p-2 mt-2 text-white">
            <b>{c.name}</b>
            <p>{c.description}</p>
            {c.image_url && <img src={c.image_url} className="w-24" />}
          </div>
        ))}

      </motion.div>
    </div>
  );
}

export default Admin;