import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 🔥 NEW

  const handleSignup = async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data?.user;

    if (!user) {
      alert("Email confirmation ON hai ⚠️");
      return;
    }

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
        alert("Profile create nahi hua ❌");
        return;
      }
    }

    alert("Signup successful 🚀");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow w-80">

        <h2 className="text-2xl font-bold mb-4 text-center">Signup</h2>

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
          className="bg-green-500 text-white w-full py-2 rounded"
          onClick={handleSignup}
        >
          Signup
        </button>

      </div>
    </div>
  );
}

export default Signup;