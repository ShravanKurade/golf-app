import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function Leaderboard() {
  const [users, setUsers] = useState([]);

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("coins", { ascending: false }); // 🔥 coins se ranking

    setUsers(data || []);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white">

      <h1 className="text-2xl font-bold text-center mb-4">
        🏆 Leaderboard
      </h1>

      {users.map((u, i) => (
        <div
          key={u.id}
          className="bg-white/20 p-3 mt-2 rounded flex justify-between"
        >
          <span>#{i + 1}</span>
          <span>{u.email || u.id.slice(0, 6)}</span>
          <span>🪙 {u.coins || 0}</span>
        </div>
      ))}

    </div>
  );
}

export default Leaderboard;