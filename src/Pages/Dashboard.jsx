import { motion } from "framer-motion";
import { supabase } from "../supabase";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Dashboard() {
  const navigate = useNavigate();

  const [scores, setScores] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [latestDraw, setLatestDraw] = useState(null);

  const [subscription, setSubscription] = useState("inactive");
  const [subscriptionEnd, setSubscriptionEnd] = useState(null);

  const [charities, setCharities] = useState([]);
  const [selectedCharity, setSelectedCharity] = useState("");
  const [charityPercent, setCharityPercent] = useState(10);

  // ================= FETCH =================
  const fetchScores = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false })
      .limit(5);

    setScores(data || []);
  };

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("draws")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false })
      .limit(5);

    setHistory(data || []);
  };

  const fetchLatestDraw = async () => {
    const { data } = await supabase
      .from("draws")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    setLatestDraw(data);
  };

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_end")
      .eq("id", user.id)
      .maybeSingle();

    if (data?.subscription_end) {
      const now = new Date();
      const end = new Date(data.subscription_end);

      if (now > end) {
        setSubscription("inactive");

        await supabase
          .from("profiles")
          .update({ subscription_status: "inactive" })
          .eq("id", user.id);

        toast.error("Subscription expired ❌");
      } else {
        setSubscription("active");
        setSubscriptionEnd(end);
      }
    } else {
      setSubscription("inactive");
    }
  };

  const fetchCharities = async () => {
    const { data } = await supabase.from("charities").select("*");
    setCharities(data || []);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
      } else {
        fetchScores();
        fetchHistory();
        fetchProfile();
        fetchLatestDraw();
        fetchCharities();
      }
    };

    checkUser();
  }, []);

  // ================= ADD SCORE =================
  const addScore = async () => {
    if (subscription !== "active") {
      return toast.error("Buy Premium first 💳");
    }

    if (!input || input < 1 || input > 45) {
      return toast.error("Score must be 1–45 ❌");
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { data: oldScores } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: true });

    if (oldScores && oldScores.length >= 5) {
      await supabase.from("scores").delete().eq("id", oldScores[0].id);
    }

    await supabase.from("scores").insert([
      {
        user_id: user.id,
        score: Number(input),
        date: new Date().toLocaleDateString(),
      },
    ]);

    setInput("");
    fetchScores();
    toast.success("Score added ✅");
  };

  // ================= PAYMENT =================
  const handlePayment = async () => {
    toast("Redirecting to payment... 💳");

    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const start = new Date();
      const end = new Date();
      end.setDate(start.getDate() + 30);

      await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_start: start,
          subscription_end: end,
          subscription_plan: "monthly",
        })
        .eq("id", user.id);

      setSubscription("active");
      setSubscriptionEnd(end);

      toast.success("Subscription Active ✅");
    }, 1500);
  };

  // ================= DRAW =================
  const runDraw = async () => {
    if (subscription !== "active")
      return toast.error("Buy Premium first");

    if (scores.length < 5)
      return toast.error("Add 5 scores");

    if (!selectedCharity)
      return toast.error("Select charity ❤️");

    if (charityPercent < 10)
      return toast.error("Minimum charity 10%");

    const drawNumbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    const userNumbers = scores.map((s) => s.score);

    let matchCount = userNumbers.filter((n) =>
      drawNumbers.includes(n)
    ).length;

    const totalPool = 10000;

    let message = "";
    let prize = "";

    if (matchCount === 5) {
      message = "🥇 Jackpot";
      prize = `₹${Math.floor(totalPool * 0.4)}`;
    } else if (matchCount === 4) {
      message = "🥈 4 Matches";
      prize = `₹${Math.floor(totalPool * 0.35)}`;
    } else if (matchCount === 3) {
      message = "🥉 3 Matches";
      prize = `₹${Math.floor(totalPool * 0.25)}`;
    } else {
      message = "😢 No Win";
      prize = "₹0";
    }

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("draws").insert([
      {
        user_id: user.id,
        numbers: drawNumbers.join(", "),
        matches: matchCount,
        result: `${message} | Prize: ${prize} | Charity: ${selectedCharity} (${charityPercent}%)`,
      },
    ]);

    fetchHistory();
    fetchLatestDraw();

    toast.success("Entered Draw 🎯");
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20"
      >

        <h1 className="text-3xl font-bold text-white text-center">
          🎯 Your Golf Dashboard
        </h1>

        <p className="text-white text-center mb-4">
          Play Golf. Win Rewards. Change Lives ❤️
        </p>

        {/* LOGOUT */}
        <button
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl mb-3"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/login");
          }}
        >
          Logout
        </button>

        {/* SUBSCRIPTION */}
        <button
          className={`w-full px-4 py-2 rounded-xl text-white mb-2 ${
            subscription === "active"
              ? "bg-green-500"
              : "bg-gradient-to-r from-pink-500 to-purple-500"
          }`}
          onClick={handlePayment}
        >
          {subscription === "active"
            ? "✅ Premium Active"
            : "Buy Premium ₹99 💳"}
        </button>

        {subscriptionEnd && (
          <p className="text-white text-sm">
            Valid till: {subscriptionEnd.toLocaleDateString()}
          </p>
        )}

        {/* CHARITY */}
        <h3 className="text-white mt-4">Select Charity ❤️</h3>

        <select
          className="bg-white/20 p-2 rounded w-full text-white"
          value={selectedCharity}
          onChange={(e) => setSelectedCharity(e.target.value)}
        >
          <option value="">Choose charity</option>
          {charities.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="bg-white/20 p-2 rounded w-full mt-2 text-white"
          value={charityPercent}
          onChange={(e) => setCharityPercent(e.target.value)}
        />

        {/* ADD SCORE */}
        <h3 className="text-white mt-4">Add Score</h3>

        <div className="flex gap-2">
          <input
            type="number"
            className="bg-white/20 p-2 rounded w-full text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button className="bg-purple-500 px-4 rounded text-white" onClick={addScore}>
            Add
          </button>
        </div>

        {/* SCORES */}
        <ul className="mt-4 space-y-2">
          {scores.map((s) => (
            <li key={s.id} className="bg-white/20 p-2 rounded text-white">
              🎯 {s.score} | 📅 {s.date}
            </li>
          ))}
        </ul>

        {/* DRAW */}
        <button
          className="bg-purple-500 w-full py-2 mt-4 rounded text-white"
          onClick={runDraw}
        >
          Enter Draw 🎯
        </button>

        {/* HISTORY */}
        <h3 className="text-white mt-6">📜 History</h3>

        <ul className="mt-2 space-y-2">
          {history.map((h) => (
            <li key={h.id} className="bg-white/20 p-2 rounded text-white">
              🎯 {h.result}
            </li>
          ))}
        </ul>

      </motion.div>
    </div>
  );
}

export default Dashboard;