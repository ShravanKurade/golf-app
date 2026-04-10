import { useRef } from "react";
import confetti from "canvas-confetti";
import emailjs from "@emailjs/browser";
import { motion } from "framer-motion";
import { supabase } from "../supabase";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";

function Dashboard() {
  const [coins, setCoins] = useState(0);
  const [lastPlayed, setLastPlayed] = useState(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const navigate = useNavigate();
  const [subscriptionPlan, setSubscriptionPlan] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [draws, setDraws] = useState([]);
  const [scores, setScores] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [latestDraw, setLatestDraw] = useState(null);

  const [subscription, setSubscription] = useState("inactive");
  const [subscriptionEnd, setSubscriptionEnd] = useState(null);

  const [charities, setCharities] = useState([]);
  const [selectedCharity, setSelectedCharity] = useState("");
  const [charityPercent, setCharityPercent] = useState(10);

  const [spinning, setSpinning] = useState(false);
  const [displayNumbers, setDisplayNumbers] = useState([]);

  const [isJackpot, setIsJackpot] = useState(false);

  const [bgAudio] = useState(new Audio("/bg.mp3"));
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  
  const dashboardRef = useRef();

  const spinAudioRef = useRef(new Audio("/spin.mp3"));
  spinAudioRef.current.loop = true;

  const claimBonus = async () => {
  const today = new Date().toDateString();

  if (lastPlayed === today) {
    return toast.error("Already claimed today ❌");
  }

  const user = await getUser();

  const bonus = subscription === "active" ? 20 : 10;

  await supabase
    .from("profiles")
    .update({
      last_played: today,
      coins: coins + bonus
    })
    .eq("id", user.id);

  setCoins(coins + bonus);
  setLastPlayed(today);

  toast.success(`🎁 +${bonus} coins`);
};

  const playSpin = () => {
    const audio = spinAudioRef.current;
    audio.currentTime = 0;
    audio.play();
  };

  const stopSpin = () => {
    const audio = spinAudioRef.current;
    audio.pause();
    audio.currentTime = 0;
  };

  const playWin = () => {
    const audio = new Audio("/win.mp3");
    audio.volume = 0.5;
    audio.play();
  };

  const playLose = () => {
    const audio = new Audio("/lose.mp3");
    audio.volume = 0.5;
    audio.play();
  };
  // ================= FETCH =================

  // 🔥 COMMON USER GET (reuse everywhere)
  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };

  // ================= USER DRAWS =================
  const fetchUserDraws = async () => {
    const user = await getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.log("Draws Error:", error);
      return;
    }

    setDraws(data || []);
  };

  // ================= SCORES =================
  const fetchScores = async () => {
    const user = await getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false })
      .limit(5);

    if (error) {
      console.log("Scores Error:", error);
      return;
    }

    setScores(data || []);
  };

  // ================= HISTORY =================
  const fetchHistory = async () => {
    const user = await getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false })
      .limit(5);

    if (error) {
      console.log("History Error:", error);
      return;
    }

    setHistory(data || []);
  };

  // ================= LATEST DRAW =================
  const fetchLatestDraw = async () => {
  const user = await getUser();
  if (!user) return;

  const { data } = await supabase
    .from("draws")
    .select("*")
    .eq("user_id", user.id)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  setLatestDraw(data);
};

  // ================= PROFILE =================
  async function fetchProfile() {

    const user = await getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("subscription_status, subscription_end, subscription_plan,coins, last_played")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.log("Profile Error:", error);
      return;
    }

    if (!data) {
      setSubscription("inactive");
      return;
    }
    if (data) {
      setCoins(data.coins || 0);
      if (data.last_played) setLastPlayed(data.last_played);
    }
    // 🔥 DATE CHECK
    if (data.subscription_end) {
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
        setSubscriptionPlan(data.subscription_plan || "");
      }
    } else {
      setSubscription("inactive");
    }
  }

  const fetchCharities = async () => {
    const { data } = await supabase.from("charities").select("*");
    setCharities(data || []);
  };


 useEffect(() => {

  spinAudioRef.current.loop = true;
  // 🎵 BACKGROUND MUSIC
  bgAudio.loop = true;
  bgAudio.volume = 0.3;

  bgAudio.play()
    .then(() => setIsMusicPlaying(true))
    .catch(() => console.log("Autoplay blocked 😢"));

  const startMusicOnClick = () => {
    bgAudio.play();
    setIsMusicPlaying(true);
    window.removeEventListener("click", startMusicOnClick);
  };

  window.addEventListener("click", startMusicOnClick);

  // ⏳ TIMER
  const interval = setInterval(() => {
    const nextDraw = new Date();
    nextDraw.setDate(nextDraw.getDate() + 7);

    const diff = nextDraw - new Date();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

    setTimeLeft(`${days}d ${hours}h left`);
  }, 1000);

  // 👤 USER CHECK + DATA FETCH
  const checkUser = async () => {
    const giveFirstBonus = async () => {
  const user = await getUser();
  if (!user) return;

  const { data } = await supabase
    .from("profiles")
    .select("coins, bonus_claimed")
    .eq("id", user.id)
    .maybeSingle();

  if (data?.bonus_claimed) return;

  await supabase
    .from("profiles")
    .update({
      coins: (data?.coins || 0) + 200,
      bonus_claimed: true
    })
    .eq("id", user.id);

  setCoins((data?.coins || 0) + 200);
  toast.success("🎉 Welcome Bonus: 200 Coins 🪙");
};
    const { data: { user } } = await supabase.auth.getUser();
if (user) {
  await supabase.from("profiles").upsert([
    {
      id: user.id,
      email: user.email,
    },
  ]);
  await giveFirstBonus();

}
    if (!user) {
      navigate("/login");
    } else {
      fetchScores();
      fetchHistory();
      fetchProfile();
      fetchCharities();
      fetchUserDraws();
    }
  };

  checkUser();

  // 🔥 PROFILE AUTO REFRESH
  const profileInterval = setInterval(() => {
    fetchProfile();
  }, 2000);

  // 🧹 CLEANUP (VERY IMPORTANT)
  return () => {
    clearInterval(interval);
    clearInterval(profileInterval);

    window.removeEventListener("click", startMusicOnClick);

    bgAudio.pause();
    bgAudio.currentTime = 0;
  };

}, []);
const getAISuggestion = () => {
  const nums = new Set();

  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }

  return Array.from(nums);
};
// ================= ADD SCORE =================
const addScore = async () => {
  // FREE USER + LOW COINS
if (subscription !== "active" && coins < 5) {
  setShowUpgradePopup(true);
  return;
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const amount = selectedPlan === "monthly" ? 99 : 999;

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY,
    amount: amount * 100,   // 🔥 Razorpay paisa paise me leta hai
    currency: "INR",
    name: "Golf Charity App",
    description: "Subscription Payment",

    handler: async function (response) {

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return toast.error("User not found ❌");
      }

      const start = new Date();
      let end = new Date();

      if (selectedPlan === "monthly") {
        end.setDate(start.getDate() + 30);
      } else {
        end.setFullYear(start.getFullYear() + 1);
      }

      const validTill = end.toLocaleDateString();

      // 🔥 DB UPDATE
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          subscription_plan: selectedPlan,
          subscription_end: end.toISOString()
        })
        .eq("id", user.id);

      if (error) {
        console.log("UPDATE ERROR:", error);
        return toast.error("DB update failed ❌");
      }

      // 🔥 EMAIL SEND
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          user_email: user.email,
          valid_till: validTill,
          plan_amount: amount
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      await fetchProfile();

      toast.success("Payment successful 💳 + Email sent 📩");
    },

    prefill: {
      email: user.email,
    },

    theme: {
      color: "#9333ea",
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};

// ================= DRAW =================
// 📸 UPLOAD PROOF
const uploadProof = async (drawId) => {
  const file = proofFile;

  if (!file) return toast.error("Select file");

  const fileName = `${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from("proofs")
    .upload(fileName, file);

  if (error) return toast.error("Upload failed");

  const publicUrl = supabase
    .storage
    .from("proofs")
    .getPublicUrl(fileName).data.publicUrl;

  await supabase
    .from("draws")
    .update({ proof_url: publicUrl })
    .eq("id", drawId);

  toast.success("Proof uploaded ✅");
  fetchHistory();
};

const runDraw = async () => {
  if (subscription !== "active" && coins < 5) {
  setShowUpgradePopup(true);
  return;
}
if (coins <= 0) {
  setShowUpgradePopup(true);
  return;
}
  if (scores.length < 5)
    return toast.error("Add 5 scores");

  if (!selectedCharity)
    return toast.error("Select charity ❤️");

  if (charityPercent < 10)
    return toast.error("Minimum charity 10%");

  setDisplayNumbers([]); // reset
  setSpinning(true);

  playSpin(); // 🔊 start spin sound
  bgAudio.volume = 0.1; // 🔥 ADD HERE

  // 🎰 SPIN EFFECT
  const spinInterval = setInterval(() => {
    const temp = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );
    setDisplayNumbers(temp);
  }, 100);

  setTimeout(async () => {
    clearInterval(spinInterval);
    stopSpin(); // 🔇 stop spin sound
    bgAudio.volume = 0.3; // 🔥 ADD HERE
    // 🎯 FINAL NUMBERS
    // 🎯 CONTROLLED LOGIC
let matchCount;

const rand = Math.random();

if (rand < 0.02) {
  matchCount = 5;
} else if (rand < 0.08) {
  matchCount = 4;
} else if (rand < 0.20) {
  matchCount = 3;
} else {
  matchCount = Math.floor(Math.random() * 2);
}

// 🎯 USER NUMBERS
const userNumbers = scores.map(s => s.score);

// 🎯 GENERATE DRAW NUMBERS
let drawNumbers = [...userNumbers];

// shuffle
drawNumbers.sort(() => 0.5 - Math.random());

// keep required matches
drawNumbers = drawNumbers.slice(0, matchCount);

// fill remaining random
while (drawNumbers.length < 5) {
  const num = Math.floor(Math.random() * 45) + 1;
  if (!drawNumbers.includes(num)) drawNumbers.push(num);
}

setDisplayNumbers(drawNumbers);
    
const { data: { user } } = await
supabase.auth.getUser();

    let message = "";
    let prizeAmount = 0;
    let coinReward = 0;

// 🎯 PRIZE LOGIC
if (matchCount === 5) {
  message = "🥇 Jackpot";
  prizeAmount = 1500;
  setIsJackpot(true);
  playWin();

} else if (matchCount === 4) {
  message = "🥈 4 Matches";
  prizeAmount = 500;
  playWin();
  } else if (matchCount === 3) {
  message = "🥉 3 Matches";
  prizeAmount = 100; 
  playWin();
} else if (matchCount === 2) {
  message = "2 Matches";
  coinReward = 30;
  playWin();

} else if (matchCount === 1) {
  message = "1 Match";
  coinReward = 15;
  playWin();

} else {
  message = "😢 No Win";
  prizeAmount = 0;
  playLose();
}

// 💖 CHARITY CUT
const finalPrize = Math.floor(prizeAmount * (1 - charityPercent / 100));

// 🎯 FINAL STRING
const prize = `₹${finalPrize}`;

// 💰 FINAL COINS CALCULATION
let finalCoins = coins;

// 🎁 add reward
if (coinReward > 0) {
  finalCoins += coinReward;
}

// 💸 subtract cost
if (subscription === "active") {
  finalCoins -= 3;
} else {
  finalCoins -= 5;
}

// ✅ UPDATE ONCE
await supabase
  .from("profiles")
  .update({ coins: finalCoins })
  .eq("id", user.id);

setCoins(finalCoins);
// 🎉 CONFETTI
if (matchCount >= 3) {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
  });
}
// ✅ STEP 1: INSERT FIRST
const { data: drawData, error } = await supabase
  .from("draws")
  .insert([
    {
      user_id: user.id, // ✅ ab error nahi aayega
      numbers: drawNumbers.join(", "),
      matches: matchCount,
      result: `${message} | Prize: ${prize} | Charity: ${selectedCharity} (${charityPercent}%)`,
    },
  ])
  .select()
  .single();

if (error) {
  console.log("Insert Error:", error);
  return toast.error("Draw save failed ❌");
}

const drawId = drawData.id; // ✅ ID mil gaya

// ✅ STEP 2: ONLY IF JACKPOT → SCREENSHOT
if (matchCount === 5) {
  const canvas = await html2canvas(dashboardRef.current);
  const image = canvas.toDataURL("image/png");

  const blob = await (await fetch(image)).blob();
  const fileName = `jackpot_${Date.now()}.png`;

  await supabase.storage.from("proofs").upload(fileName, blob);

  const publicUrl = supabase
    .storage
    .from("proofs")
    .getPublicUrl(fileName).data.publicUrl;

  // ✅ STEP 3: UPDATE DB
  await supabase
    .from("draws")
    .update({ screenshot_url: publicUrl })
    .eq("id", drawId);
}

    fetchHistory();
    fetchLatestDraw();

// 💎 PREMIUM USER
if (subscription === "active") {
  await supabase
    .from("profiles")
    .update({
      coins: coins -3
    })
    .eq("id", user.id);

  setCoins(coins - 3);
}

// 🟢 FREE USER
else {
  await supabase
    .from("profiles")
    .update({
      coins: coins - 5
    })
    .eq("id", user.id);

  setCoins(coins - 5);
}

    toast.success("Draw Completed 🎉");

    // 💰 RESET JACKPOT
    setTimeout(() => setIsJackpot(false), 4000);

  }, 2500);
};
const totalWinnings = draws.reduce((sum, d) => {
  const match = d.result?.match(/₹(\d+)/);
  return sum + (match ? Number(match[1]) : 0);
}, 0);

// 💰 TOTAL DONATED
const totalDonated = draws.reduce((sum, d) => {
  const match = d.result?.match(/\((\d+)%\)/);
  return sum + (match ? Number(match[1]) : 0);
}, 0);
// ================= UI =================
return (
  <div ref={dashboardRef} className="relative min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

    {/* 🔊 SOUND CONTROL */}
    <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-50">

      <button
        onClick={() => {
          if (isMusicPlaying) {
            bgAudio.pause();
            bgAudio.currentTime = 0;
            setIsMusicPlaying(false);
          } else {
            bgAudio.play();
            setIsMusicPlaying(true);
          }
        }}
        className="bg-black/40 text-white px-3 py-1 rounded-full border border-white/20 text-sm"
      >
        {isMusicPlaying ? "🔊 ON" : "🔇 OFF"}
      </button>

      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => {
          const val = Number(e.target.value);
          setVolume(val);
          bgAudio.volume = val;
        }}
        className="w-20"
      />

    </div>

    {/* MAIN CARD */}
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto bg-white/20 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20"
    >



      <h1 className="text-3xl font-bold text-white text-center">
        🎯 Your Golf Dashboard
      </h1>
      <p className="text-yellow-300 text-center mt-2 font-bold">
  🪙 Coins: {coins}
</p>
      
      <p className="text-white text-center mt-2 mb-4 text-sm opacity-90">
        Play Golf. Win Rewards. Change Lives ❤️
      </p>
      <h2 className="text-white text-xl mt-4 text-center">
        💰 Total Winnings: ₹{totalWinnings}
      </h2>
      <h2 className="text-white text-lg text-center">
        ❤️ Total Donated: {totalDonated}%
      </h2>
      <h2 className="text-white mt-6 text-xl text-center">
        Your Draw History
      </h2>

      {history.map((d) => (
        <div
          key={d.id}
          className="bg-white/20 p-3 mt-2 text-white rounded"
        >
          🎯 Numbers: {d.numbers} <br />

          Result: {d.result || "Pending"}

          {/* 🏆 WINNER BADGE */}
          {d.result?.includes("Jackpot") && (
            <span className="text-yellow-300 font-bold ml-2">
              🏆 Winner
            </span>
          )}

          {/* 📸 FILE INPUT */}
          <input
            type="file"
            onChange={(e) => setProofFile(e.target.files[0])}
            className="mt-2"
          />

          {/* 📸 UPLOAD BUTTON */}
          <button
            onClick={() => uploadProof(d.id)}
            className="bg-blue-500 px-2 py-1 rounded text-white mt-1"
          >
            Upload Proof 📸
          </button>
        </div>
      ))}

      {/* PLAN SELECT */}
      <h3 className="text-white mt-2">Choose Plan 💳</h3>

      <select
        className="bg-white/20 text-white p-2 rounded w-full mt-2"
        value={selectedPlan}
        onChange={(e) =>
          setSelectedPlan(e.target.value)}
      >
        <option value="monthly" className="text-black">
          Monthly ₹99
        </option>
        <option value="yearly" className="text-black">
          Yearly ₹999 (Save 🔥)
        </option>
      </select>

      {/* SUBSCRIPTION */}
      <button
        className="w-full px-4 py-2 rounded-xl text-white mt-3 transition duration-300
  bg-gradient-to-r from-pink-500 to-purple-500 hover:scale-105"
        onClick={handlePayment}
      >
        {subscription === "active" ? (
          subscriptionPlan === "monthly" && selectedPlan === "yearly" ? (
            "🚀 Upgrade to Yearly ₹999"
          ) : subscriptionPlan === "yearly" ? (
            "✅ Yearly Active"
          ) : (
            "✅ Monthly Active"
          )
        ) : selectedPlan === "monthly" ? (
          "Buy Monthly ₹99 💳"
        ) : (
          "Buy Yearly ₹999 💳"
        )}
      </button>

      {/* PLAN DISPLAY */}
      <p className="text-white text-sm mt-1">
        Plan: <b>{selectedPlan === "monthly" ? "Monthly ₹99" : "Yearly ₹999"}</b>
      </p>

      {subscriptionEnd && (
        <p className="text-white text-sm">
          Valid till: {subscriptionEnd.toLocaleDateString()}
        </p>
      )}

      {/* LATEST DRAW */}
      <h3 className="text-white mt-4">🎯 Latest Draw</h3>

      {latestDraw ? (
        <div className="bg-white/30 p-3 rounded text-white mt-2">
          <p><b>Numbers:</b> {latestDraw.numbers}</p>
          <p><b>Result:</b> {latestDraw.result}</p>
        </div>
      ) : (
        <p className="text-white text-sm mt-2">No draw yet</p>
      )}
      <div className="flex justify-center mt-3 mb-3">
        <button
          onClick={() => navigate("/charities")}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl shadow hover:scale-105 hover:shadow-lg transition duration-300"
        >
          View Charities ❤️
        </button>
      </div>
      {/* CHARITY */}
      <h3 className="text-white mt-4">Select Charity ❤️</h3>

      <select
        className="bg-white/30 text-white p-2 rounded w-full"
        value={selectedCharity}
        onChange={(e) => setSelectedCharity(e.target.value)}
      >
        <option value="" className="text-black">Choose charity</option>
        {charities.map((c) => (
          <option key={c.id} value={c.name} className="text-black">
            {c.name}
          </option>
        ))}
      </select>

      <input
        type="number"
        className="bg-white/30 text-white p-2 rounded w-full mt-2"
        value={charityPercent}
        onChange={(e) => setCharityPercent(e.target.value)}
      />
{/* 🎁 DAILY BONUS */}
<button
  onClick={claimBonus}
  className="bg-yellow-500 w-full py-2 mt-3 rounded text-white"
>
  🎁 Claim Daily Bonus
</button>

{/* 🏆 LEADERBOARD BUTTON */}
<button
  onClick={() => navigate("/leaderboard")}
  className="bg-blue-500 w-full py-2 mt-3 rounded text-white"
>
  🏆 View Leaderboard
</button>
      {/* ADD SCORE */}
      <h3 className="text-white mt-4">Add Score(1-45)</h3>
<button
  onClick={() => {
    const suggestion = getAISuggestion();
    setScores(suggestion.map((n) => ({ score: n })));
  }}
  className="bg-green-500 w-full py-2 mt-2 rounded text-white hover:bg-green-600 transition"
>
  🤖 Get AI Suggestion
</button>
      <div className="flex gap-2">
        <input
          type="number"
          className="bg-white/30 text-white p-2 rounded w-full"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button className="bg-purple-500 px-4 rounded text-white hover:bg-purple-600 hover:scale-105 transition duration-300"
          onClick={addScore}>
          Add
        </button>
      </div>

      {/* SCORES */}
      <ul className="mt-4 space-y-2">
        {scores.map((s) => (
          <li key={s.id} className="bg-white/30 p-2 rounded text-white">
            🎯 {s.score} | 📅 {s.date}
          </li>
        ))}
      </ul>
      <p className="text-white mt-3 font-bold">
        🎯 Your: {scores.map((s) => s.score).join(", ")}
      </p>

      {/* DRAW */}
      <button
        className="bg-purple-500 w-full py-2 mt-4 rounded text-white hover:bg-purple-600 hover:scale-105 hover:shadow-lg transition duration-300"
        onClick={runDraw}
      >
        Enter Draw 🎯
      </button>
      {isJackpot && (
        <div className="text-center mt-4 animate-bounce">
          <h1 className="text-4xl font-bold text-yellow-300 drop-shadow-lg">
            💰 JACKPOT WON 💰
          </h1>
        </div>
      )}
      <div className="text-center text-white mt-4">
        {spinning ? (
          <h2 className="text-3xl font-bold text-yellow-300 animate-pulse drop-shadow-[0_0_20px_gold]">
            🎰 {displayNumbers.join(" - ")}
          </h2>
        ) : displayNumbers.length > 0 ? (
          <h2 className="text-xl">
            🎯 {displayNumbers.join(" - ")}
          </h2>
        ) : null}
      </div>
      {/* HISTORY */}
      <h3 className="text-white mt-6">📜 History</h3>

      <ul className="mt-2 space-y-2">
        {history.map((h) => (
          <li key={h.id} className="bg-white/30 p-2 rounded text-white">
            🎯 {h.numbers} | {h.result}
          </li>
        ))}
      </ul>
      {/* LOGOUT */}
      <div className="flex justify-center mt-6">
        <button
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl mb-3 hover:scale-105 hover:shadow-lg transition duration-300"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/login");
          }}
        >
          Logout
        </button>
        {showUpgradePopup && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

    <div className="bg-white p-6 rounded-2xl text-center w-[90%] max-w-sm shadow-xl">

      <h2 className="text-xl font-bold mb-2">
        💰 Low Coins!
      </h2>

      <p className="text-gray-600 mb-4">
        Not enough coins 😢
      </p>

      <p className="text-purple-600 font-semibold mb-4">
        Upgrade to Premium 🎯
      </p>

      <div className="flex gap-2">

        <button
          onClick={() => {
            setShowUpgradePopup(false);
            handlePayment();
          }}
          className="flex-1 bg-purple-500 text-white py-2 rounded"
        >
          Upgrade 🚀
        </button>

        <button
          onClick={() => setShowUpgradePopup(false)}
          className="flex-1 bg-gray-300 py-2 rounded"
        >
          Cancel
        </button>

      </div>

    </div>
  </div>
)}
      </div>
    </motion.div>
  </div>
);
}

export default Dashboard;