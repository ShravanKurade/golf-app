import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 🔥 NEW
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("User not found ❌");
      setLoading(false);
      return;
    }

    let role = "user";

    for (let i = 0; i < 3; i++) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.role) {
        role = data.role;
        break;
      }

      await new Promise((res) => setTimeout(res, 300));
    }

    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-80">

        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full mb-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* 🔥 PASSWORD WITH TOGGLE */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="border p-2 w-full mb-3 pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <span
            className="absolute right-3 top-2 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button
          className="bg-blue-500 text-white w-full py-2 rounded disabled:opacity-50"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          className="w-full mt-3 border py-2 rounded hover:bg-gray-100"
          onClick={() => navigate("/signup")}
        >
          Go to Signup
        </button>

      </div>
    </div>
  );
}

export default Login;