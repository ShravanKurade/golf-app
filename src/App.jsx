import Leaderboard from "./Pages/Leaderboard";
import Charities from "./Pages/Charities";
import CharityDetails from "./Pages/CharityDetails";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { Toaster } from "react-hot-toast";

import Landing from "./Pages/Landing"; // ✅ NEW
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import Dashboard from "./Pages/Dashboard";
import Admin from "./Pages/Admin";

function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        setRole(data?.role || "user");
      }

      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>

      <Toaster position="top-right" />

      <Routes>

        <Route path="/leaderboard" element={<Leaderboard />} />
        
        {/* 🔥 LANDING PAGE */}
        <Route path="/" element={<Landing />} />

        {/* AUTH */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* USER */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            user && role === "admin"
              ? <Admin />
              : <Navigate to="/login" />
          }
        />
      <Route path="/charities" element={<Charities />} />
<Route path="/charity/:id" element={<CharityDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;