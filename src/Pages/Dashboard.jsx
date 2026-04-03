import { motion } from "framer-motion";
import { supabase } from "../supabase";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const [scores, setScores] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [latestDraw, setLatestDraw] = useState(null);
  const [subscription, setSubscription] = useState("inactive");

  const [charities, setCharities] = useState([]);
  const [selectedCharity, setSelectedCharity] = useState("");
  const [charityPercent, setCharityPercent] = useState(10);

  // FETCH FUNCTIONS (same)
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
      .select("subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    setSubscription(data?.subscription_status || "inactive");
  };

  const fetchCharities = async () => {
    const { data } = await supabase.from("charities").select("*");
    setCharities(data || []);
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
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

  // ADD SCORE (same)
  const addScore = async () => {
    if (subscription !== "active") {
      alert("Buy Premium first 💳");
      return;
    }

    if (!input || input < 1 || input > 45) {
      alert("Score must be between 1 and 45");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("scores").insert([
      {
        user_id: user.id,
        score: Number(input),
        date: new Date().toLocaleDateString(),
      },
    ]);

    setInput("");
    fetchScores();
  };

  // PAYMENT (same)
  const handlePayment = async () => {
    alert("Redirecting to payment... 💳");

    setTimeout(async () => {
      alert("Payment Successful ✅");

      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from("profiles")
        .update({ subscription_status: "active" })
        .eq("id", user.id);

      setSubscription("active");
    }, 1500);
  };

  // UPLOAD PROOF (same)
  const uploadProof = async (drawId, file) => {
    if (!file) return alert("Select file ❌");

    const fileName = `${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("proofs")
      .upload(fileName, file);

    if (error) return alert("Upload failed ❌");

    const { data } = supabase.storage
      .from("proofs")
      .getPublicUrl(fileName);

    await supabase
      .from("draws")
      .update({
        proof_url: data.publicUrl,
        verification_status: "pending",
      })
      .eq("id", drawId);

    alert("Proof uploaded ✅");
    fetchHistory();
  };

  // DRAW (same)
  const runDraw = async () => {
    if (subscription !== "active") return alert("Buy Premium first");
    if (scores.length < 5) return alert("Add 5 scores");
    if (!selectedCharity) return alert("Select charity");

    const drawNumbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    const userNumbers = scores.map((s) => s.score);

    let matchCount = 0;
    userNumbers.forEach((num) => {
      if (drawNumbers.includes(num)) matchCount++;
    });

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("draws").insert([
      {
        user_id: user.id,
        numbers: drawNumbers.join(", "),
        matches: matchCount,
        result: matchCount >= 3 ? "🎉 Win" : "😢 No Win",
      },
    ]);

    fetchHistory();
    fetchLatestDraw();
  };

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

        {/* Logout */}
        <button
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl shadow-lg hover:scale-105 transition transform"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/");
          }}
        >
          Logout
        </button>

        {/* Subscription */}
        <button
          className={`w-full mt-4 px-4 py-2 rounded-xl text-white ${
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

        {/* Latest Draw */}
        <h3 className="text-white mt-4">🎯 Latest Draw</h3>

        {latestDraw && (
          <div className="bg-white/20 p-3 rounded text-white mt-2">
            <p><b>Numbers:</b> {latestDraw.numbers}</p>
            <p><b>Result:</b> {latestDraw.result}</p>
          </div>
        )}

        {/* Charity */}
        <h3 className="text-white mt-4">Select Charity ❤️</h3>

        <select
          className="bg-white/20 backdrop-blur-md border border-white/30 text-white p-2 rounded w-full"
          value={selectedCharity}
          onChange={(e) => setSelectedCharity(e.target.value)}
        >
          <option value="">Choose charity</option>
          {charities.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <input
          type="number"
          className="bg-white/20 backdrop-blur-md border border-white/30 text-white p-2 rounded w-full mt-2"
          value={charityPercent}
          onChange={(e) => setCharityPercent(e.target.value)}
        />

        {/* Add Score */}
        <h3 className="text-white mt-4">Add Score</h3>

        <div className="flex gap-2 mt-2">
          <input
            type="number"
            className="bg-white/20 text-white p-2 rounded w-full"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 rounded-xl"
            onClick={addScore}
          >
            Add
          </button>
        </div>

        {/* Draw */}
        <button
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl mt-4 w-full"
          onClick={runDraw}
        >
          Enter Monthly Draw 🎯
        </button>

        {/* History */}
        <h3 className="text-white mt-6">📜 Draw History</h3>

        <ul className="mt-2 space-y-2">
          {history.map((h) => (
            <li key={h.id} className="bg-white/20 p-2 rounded text-white">

              🎯 {h.numbers} | Matches: {h.matches} | {h.result}

              <br />

              Status: {h.verification_status || "pending"}

              {!h.proof_url && (
                <input
                  type="file"
                  onChange={(e) => uploadProof(h.id, e.target.files[0])}
                />
              )}

              {h.proof_url && (
                <a href={h.proof_url} target="_blank" rel="noreferrer">
                  View Proof 📸
                </a>
              )}

            </li>
          ))}
        </ul>

      </motion.div>
    </div>
  );
}

export default Dashboard;