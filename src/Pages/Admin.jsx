import { useEffect, useState } from "react";
import { supabase } from "../supabase";

function Admin() {
  const [draws, setDraws] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [subscribers, setSubscribers] = useState(0);
  const [revenue, setRevenue] = useState(0);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch draws
  const fetchDraws = async () => {
    const { data, error } = await supabase
      .from("draws")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log("Draw error:", error);
      return;
    }

    setDraws(data || []);
  };

  // 🔥 Fetch users count
  const fetchUsersCount = async () => {
    const { count, error } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.log("User count error:", error);
      return;
    }

    setUsersCount(count || 0);
  };

  // 🔥 FINAL FIX: Subscribers + Revenue
  const fetchSubscribers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*");

    if (error) {
      console.log("Subscriber error:", error);
      return;
    }

    console.log("PROFILE DATA:", data); // debug

    const activeUsers = data?.filter(
      (u) => u.subscription_status === "active"
    );

    const total = activeUsers?.length || 0;

    setSubscribers(total);
    setRevenue(total * 99);
  };

  // 🔥 ADMIN DRAW
  const runDraw = async () => {
    const numbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    const { error } = await supabase.from("draws").insert([
      {
        numbers: numbers.join(", "),
        result: "Draw Generated 🎯",
      },
    ]);

    if (error) {
      console.log(error);
      alert("Draw failed ❌");
      return;
    }

    alert("Draw Created 🎯");
    fetchDraws();
  };

  // 🔥 Check admin
  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.log("Role error:", error);
      setLoading(false);
      return;
    }

    if (data?.role === "admin") {
      setIsAdmin(true);

      await Promise.all([
        fetchDraws(),
        fetchUsersCount(),
        fetchSubscribers(),
      ]);
    } else {
      setIsAdmin(false);
    }

    setLoading(false);
  };

  useEffect(() => {
    checkAdmin();
  }, []);

  // 🔥 DELETE USER DATA
  const deleteUserData = async (user_id) => {
    if (!window.confirm("Delete this user's data?")) return;

    try {
      await Promise.all([
        supabase.from("scores").delete().eq("user_id", user_id),
        supabase.from("draws").delete().eq("user_id", user_id),
      ]);

      alert("User data deleted ✅");

      fetchDraws();
      fetchUsersCount();
      fetchSubscribers();
    } catch (err) {
      console.log("Delete error:", err);
      alert("Delete failed ❌");
    }
  };

  // ⏳ Loading
  if (loading) {
    return (
      <h1 className="text-center mt-10 text-gray-500 text-xl">
        Loading...
      </h1>
    );
  }

  // 🔐 Access control
  if (!isAdmin) {
    return (
      <h1 className="text-center mt-10 text-red-500 text-xl">
        Access Denied ❌
      </h1>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow">

        <h1 className="text-3xl font-bold mb-4">
          Admin Dashboard 🧑‍💻
        </h1>

        {/* Run Draw */}
        <button
          className="bg-purple-500 text-white px-4 py-2 rounded mb-4 hover:bg-purple-600"
          onClick={runDraw}
        >
          Run Draw 🎯
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

          <div className="bg-blue-100 p-4 rounded">
            <h2 className="font-bold">Users</h2>
            <p className="text-2xl">{usersCount}</p>
          </div>

          <div className="bg-green-100 p-4 rounded">
            <h2 className="font-bold">Draws</h2>
            <p className="text-2xl">{draws.length}</p>
          </div>

          <div className="bg-purple-100 p-4 rounded">
            <h2 className="font-bold">Subscribers</h2>
            <p className="text-2xl">{subscribers}</p>
          </div>

          <div className="bg-yellow-100 p-4 rounded">
            <h2 className="font-bold">Revenue 💰</h2>
            <p className="text-2xl">₹{revenue}</p>
          </div>

        </div>

        {/* Draw List */}
        <h2 className="font-bold mb-2">🎯 All Draws</h2>

        {draws.length === 0 ? (
          <p className="text-gray-500">No draws yet</p>
        ) : (
          <ul className="space-y-2">
            {draws.map((d) => (
              <li
                key={d.id}
                className="bg-gray-50 p-2 rounded flex justify-between items-center"
              >
                <span>
                  🎯 {d.numbers} | {d.result}
                </span>

                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => deleteUserData(d.user_id)}
                >
                  Delete ❌
                </button>
              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
}

export default Admin;