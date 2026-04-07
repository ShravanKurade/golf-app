import toast from "react-hot-toast";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      // 🔐 LOGIN
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Login successful ✅");

      // 👤 GET USER
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User not found ❌");
        return;
      }

      // 📌 GET ROLE
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = profile?.role || "user";

      // 🚀 REDIRECT BASED ON ROLE
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }

    } catch (err) {
      console.log(err);
      toast.error("Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20 w-80">

        <h2 className="text-2xl font-bold mb-4 text-center text-white">
          🔐 Login
        </h2>

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email"
          className="bg-white/20 border border-white/30 text-white p-2 w-full mb-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* PASSWORD */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="bg-white/20 border border-white/30 text-white p-2 w-full mb-3 pr-10 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <span
            className="absolute right-3 top-2 cursor-pointer text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* LOGIN BUTTON */}
        <button
          className="bg-gradient-to-r from-pink-500 to-purple-500 text-white w-full py-2 rounded-xl shadow hover:scale-105 transition disabled:opacity-50"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login 🚀"}
        </button>

        {/* SIGNUP */}
        <button
          className="w-full mt-3 border border-white/30 text-white py-2 rounded hover:bg-white/20"
          onClick={() => navigate("/signup")}
        >
          Go to Signup
        </button>

      </div>
    </div>
  );
}

export default Login;