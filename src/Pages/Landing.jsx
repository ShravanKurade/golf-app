import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-xl border border-white/20 max-w-xl w-full"
      >

        <h1 className="text-4xl font-bold text-white mb-4">
          ⛳ Golf Charity Platform
        </h1>

        <p className="text-white mb-6">
          Play Golf. Win Rewards. Change Lives ❤️
        </p>

        <button
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-xl shadow-lg hover:scale-105 hover:shadow-pink-500/50 transition"
          onClick={() => navigate("/login")}
        >
          Get Started 🚀
        </button>

        <div className="mt-8 text-white text-sm space-y-2">
          <p>🏆 Monthly Prize Draws</p>
          <p>❤️ Support Charities</p>
          <p>📊 Track Your Performance</p>
        </div>

      </motion.div>
    </div>
  );
}

export default Landing;