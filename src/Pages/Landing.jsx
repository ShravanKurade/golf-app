import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 flex items-center justify-center">

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-xl border border-white/20 max-w-xl w-full text-center"
      >

        {/* HERO */}
        <h1 className="text-4xl font-bold text-white mb-4">
          ⛳ Golf Charity Platform
        </h1>

        <p className="text-white mb-6">
          Play Golf. Win Rewards. Change Lives ❤️
        </p>

        <button
          onClick={() => navigate("/login")}
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 hover:shadow-pink-500/50 transition"
        >
          Get Started 🚀
        </button>

        {/* FEATURES */}
        <div className="mt-8 text-white space-y-2 text-sm">
          <p>🏆 Monthly Prize Draws</p>
          <p>❤️ Support Real Charities</p>
          <p>📊 Track Your Golf Performance</p>
        </div>

        {/* HOW IT WORKS */}
        <div className="mt-10 text-white space-y-2">
          <h2 className="text-lg font-bold">⚡ How it works</h2>
          <p>1️⃣ Enter your last 5 golf scores</p>
          <p>2️⃣ Join the monthly draw</p>
          <p>3️⃣ Win rewards & support charity ❤️</p>
        </div>

        {/* SUBSCRIPTION */}
        <div className="mt-8 text-white space-y-1">
          <h2 className="text-lg font-bold">💳 Plans</h2>
          <p>Monthly: ₹99</p>
          <p>Yearly: ₹999 (Save more 🔥)</p>
        </div>

        {/* CHARITY IMPACT */}
        <div className="mt-8 text-white space-y-1">
          <h2 className="text-lg font-bold">❤️ Make an Impact</h2>
          <p>Minimum 10% of your subscription goes to charity</p>
        </div>

      </motion.div>
    </div>
  );
}

export default Landing;