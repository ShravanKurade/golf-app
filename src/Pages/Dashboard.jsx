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

  // 🔥 Fetch scores
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

  // 🔥 Fetch history
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

  // 🔥 Latest draw
  const fetchLatestDraw = async () => {
    const { data } = await supabase
      .from("draws")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    setLatestDraw(data);
  };

  // 🔥 Fetch profile
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

  // 🔥 Fetch charities
  const fetchCharities = async () => {
    const { data } = await supabase
      .from("charities")
      .select("*");

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

  // ➕ Add score
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
  };

  // 💳 Payment (Demo)
  const handlePayment = async () => {
    alert("Redirecting to payment... 💳");

    setTimeout(async () => {
      alert("Payment Successful ✅");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ subscription_status: "active" })
        .eq("id", user.id);

      setSubscription("active");
      fetchProfile();
    }, 2000);
  };
// 📸 UPLOAD PROOF
const uploadProof = async (drawId, file) => {
  if (!file) return alert("Select file ❌");

  const fileName = `${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("proofs")
    .upload(fileName, file);

  if (uploadError) {
    alert("Upload failed ❌");
    return;
  }

  const { data } = supabase.storage
    .from("proofs")
    .getPublicUrl(fileName);

  const proof_url = data.publicUrl;

  await supabase
    .from("draws")
    .update({
      proof_url,
      verification_status: "pending"
    })
    .eq("id", drawId);

  alert("Proof uploaded ✅");

  fetchHistory();
};
  // 🎯 DRAW
  const runDraw = async () => {
    if (subscription !== "active") {
      alert("Buy Premium first 💳");
      return;
    }

    if (scores.length < 5) {
      alert("Add 5 scores first!");
      return;
    }

    if (!selectedCharity) {
      alert("Select charity ❤️");
      return;
    }

    if (charityPercent < 10) {
      alert("Minimum charity is 10%");
      return;
    }

    const drawNumbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    const userNumbers = scores.map((s) => s.score);

    let matchCount = 0;
    userNumbers.forEach((num) => {
      if (drawNumbers.includes(num)) matchCount++;
    });

    let message = "";
    let prize = "";

    if (matchCount === 5) {
      message = "🥇 Jackpot";
      prize = "₹5000";
    } else if (matchCount === 4) {
      message = "🥈 4 Matches";
      prize = "₹2000";
    } else if (matchCount === 3) {
      message = "🥉 3 Matches";
      prize = "₹500";
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

    alert("🎯 You have entered the Monthly Draw!");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow">

        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

        {/* Logout */}
        <button
          className="bg-red-500 text-white px-4 py-2 rounded mb-4"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/");
          }}
        >
          Logout
        </button>

        {/* Subscription */}
        <button
          className={`px-4 py-2 rounded w-full mb-4 ${
            subscription === "active"
              ? "bg-green-500"
              : "bg-blue-500"
          } text-white`}
          onClick={handlePayment}
        >
          {subscription === "active"
            ? "✅ Subscribed"
            : "Buy Premium ₹99 💳"}
        </button>

        {/* Latest Draw */}
        <h3 className="font-bold">🎯 Latest Draw</h3>
        {latestDraw ? (
          <div className="bg-yellow-100 p-3 rounded mt-2">
            <p><b>Numbers:</b> {latestDraw.numbers}</p>
            <p><b>Result:</b> {latestDraw.result}</p>
          </div>
        ) : (
          <p>No draw yet</p>
        )}

        {/* Charity */}
        <h3 className="font-semibold mt-4">Select Charity ❤️</h3>
        <select
          className="border p-2 rounded w-full"
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
          className="border p-2 rounded w-full mt-2"
          placeholder="Charity % (min 10)"
          value={charityPercent}
          onChange={(e) => setCharityPercent(e.target.value)}
        />

        {/* Add Score */}
        <h3 className="font-semibold mt-4">Add Score</h3>
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            className="border p-2 rounded w-full"
            placeholder="1-45"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            className="bg-green-500 text-white px-4 rounded"
            onClick={addScore}
          >
            Add
          </button>
        </div>

        {/* Scores */}
        <ul className="mt-4 space-y-2">
          {scores.map((s) => (
            <li key={s.id} className="bg-gray-50 p-2 rounded">
              Score: {s.score} | Date: {s.date}
            </li>
          ))}
        </ul>

        {/* Draw */}
        <button
          className="bg-purple-500 text-white px-4 py-2 rounded mt-4 w-full"
          onClick={runDraw}
        >
          Enter Monthly Draw 🎯
        </button>

        {/* History */}
        <h3 className="mt-6 font-bold">📜 Draw History</h3>
        <ul className="mt-2 space-y-2">
          {history.map((h) => (
            <li key={h.id} className="bg-gray-100 p-2 rounded">
            <li key={h.id} className="bg-gray-100 p-2 rounded">

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
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
}

export default Dashboard;