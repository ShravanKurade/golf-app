import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import toast from "react-hot-toast";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      return toast.error("Fill all fields ❌");
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }

    const user = data?.user;

    if (!user) {
      setLoading(false);
      return toast("Check your email for confirmation 📩");
    }

    // Create profile if not exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            role: "user",
          },
        ]);

      if (profileError) {
        setLoading(false);
        return toast.error("Profile create failed ❌");
      }
    }

    setLoading(false);
    toast.success("Signup successful 🚀");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">

      <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-xl w-full max-w-md text-center">

        {/* TITLE */}
        <h1 className="text-2xl font-bold text-white mb-2">
          ⛳ Join the Golf Charity Movement
        </h1>

        <p className="text-white text-sm mb-6">
          Play Golf. Win Rewards. Change Lives ❤️
        </p>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Enter email"
          className="w-full p-3 mb-3 rounded-lg bg-white/20 text-white placeholder-white/70 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 outline-none pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <span
            className="absolute right-3 top-3 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* BUTTON */}
        <button
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl shadow-lg hover:scale-105 transition disabled:opacity-50"
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Signup 🚀"}
        </button>

        {/* LOGIN LINK */}
        <p className="text-white text-sm mt-4">
          Already have an account?{" "}
          <span
            className="underline cursor-pointer"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>

        {/* FEATURES */}
        <div className="mt-6 text-white text-sm space-y-1">
          <p>🏆 Monthly Prize Draws</p>
          <p>❤️ Support Charities</p>
          <p>📊 Track Your Performance</p>
        </div>

      </div>
    </div>
  );
}

export default Signup;