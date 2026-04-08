import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import toast from "react-hot-toast";

function Admin() {
  const [deletedUsers, setDeletedUsers] = useState([]);
  const [lastDeletedUser, setLastDeletedUser] = useState(null);
  const [editId, setEditId] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCharity, setTotalCharity] = useState(0);
  const [users, setUsers] = useState([]);
  const [charities, setCharities] = useState([]);
  const [newCharity, setNewCharity] = useState("");
  const [charityDesc, setCharityDesc] = useState("");
  const [charityImage, setCharityImage] = useState("");
  const [draws, setDraws] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [subscribers, setSubscribers] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [prizePool, setPrizePool] = useState(0);

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);


  const undoLastDelete = async () => {
  if (!lastDeletedUser) return;

  await supabase
    .from("profiles")
    .update({ is_deleted: false })
    .eq("id", lastDeletedUser.id);

  toast.success("Restored ✅");

  setLastDeletedUser(null);

  fetchUsers();
  fetchDeletedUsers();
};
  // ================= TOGGLE FUNCTION =================

const toggleRole = async (id, role) => {
  await supabase
    .from("profiles")
    .update({
      role: role === "admin" ? "user" : "admin",
    })
    .eq("id", id);

  toast.success("Role updated ✅");
  fetchUsers();
};

const deleteDraw = async (drawId) => {
  if (!window.confirm("Delete this draw?")) return;

  const { data, error } = await supabase
    .from("draws")
    .delete()
    .eq("id", drawId)
    .select();

  console.log("Deleted:", data);

  if (error) {
    toast.error("Delete failed ❌");
    console.log(error);
    return;
  }

  toast.success("Draw deleted ✅");

  // better than reload
  setDraws((prev) => prev.filter((d) => d.id !== drawId));
};
  // =================DELETE USER =================
const deleteUser = async (id) => {
  if (!window.confirm("Delete user?")) return;

  const userToDelete = users.find(u => u.id === id);

  await supabase
    .from("profiles")
    .update({ is_deleted: true })
    .eq("id", id);

  setLastDeletedUser(userToDelete);

  toast.success("User deleted ❌");
  fetchUsers();
  fetchDeletedUsers();
};
const deleteUserPermanent = async (id) => {
  if (!window.confirm("Permanent delete? ⚠️")) return;

  try {
    // 🔥 1. DELETE FROM AUTH (backend API)
    await fetch("https://zjyhtmlzcyipcdcafmqo.supabase.co/functions/v1/deleteUserUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: id }),
    });

    // 🔥 2. DELETE FROM PROFILES TABLE (IMPORTANT)
    await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    toast.success("Deleted permanently 💀");

    // 🔥 3. REFRESH BOTH LISTS
    fetchUsers();
    fetchDeletedUsers();

  } catch (err) {
    toast.error("Delete failed ❌");
    console.log(err);
  }
};
const undoUser = async (id) => {
  await supabase
    .from("profiles")
    .update({ is_deleted: false })
    .eq("id", id);

  fetchUsers();
  fetchDeletedUsers();
  toast.success("Restored ✅");
};
  // ================= CHARITY ADD AND DELETE =================
  // ✅ ADD
const addCharity = async () => {
  if (!newCharity) return;

  await supabase.from("charities").insert([
    {
      name: newCharity,
      description: charityDesc,
      image_url: charityImage,
    },
  ]);

  setNewCharity("");
  setCharityDesc("");
  setCharityImage("");

  fetchCharities();
  toast.success("Charity Added ✅");
};

const updateCharity = async () => {
  if (!editId) return;

  await supabase
    .from("charities")
    .update({
      name: newCharity,
      description: charityDesc,
      image_url: charityImage,
    })
    .eq("id", editId);

  setEditId(null);
  setNewCharity("");
  setCharityDesc("");
  setCharityImage("");

  fetchCharities();
  toast.success("Charity Updated ✏️");
};

const deleteCharity = async (id) => {
  await supabase
    .from("charities")
    .update({ is_deleted: true })
    .eq("id", id);

  fetchCharities();
  toast.success("Charity hidden ❌");
};
const undoCharity = async (id) => {
  await supabase
    .from("charities")
    .update({ is_deleted: false })
    .eq("id", id);

  fetchCharities();
  toast.success("Restored ✅");
};
const deleteCharityPermanent = async (id) => {
  const confirmDelete = window.confirm("Permanent delete? ⚠️");

  if (!confirmDelete) return;

  await supabase
    .from("charities")
    .delete()
    .eq("id", id);

  fetchCharities();
  toast.success("Deleted permanently 💀");
};


// ================= FETCH =================

const fetchUsers = async () => {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_deleted", false); // 🔥 only active users

  setUsers(data || []);
};

  const fetchCharities = async () => {
  const { data } = await supabase
    .from("charities")
    .select("*")

  setCharities(data || []);
};
const fetchDeletedUsers = async () => {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_deleted", true);

  setDeletedUsers(data || []);
};
  const fetchDraws = async () => {
    const { data } = await supabase
      .from("draws")
      .select("*")
      .order("id", { ascending: false });

    setDraws(data || []);
  };

  const fetchUsersCount = async () => {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    setUsersCount(count || 0);
  };

  const fetchSubscribers = async () => {
    const { data } = await supabase.from("profiles").select("*");

    const activeUsers = (data || []).filter(
      (u) => u.subscription_status === "active"
    );

    const total = activeUsers.length;

    setSubscribers(total);
    setRevenue(total * 99);

    // 🔥 FULL POOL
    setPrizePool(total * 99);
  };
const fetchAnalytics = async () => {
  const { data } = await supabase.from("profiles").select("*");

  const activeUsers = (data || []).filter(
    (u) => u.subscription_status === "active"
  );

  const total = activeUsers.length;

  // 💰 Revenue
  const revenue = total * 99;
  setTotalRevenue(revenue);

  // ❤️ Charity (assume 10% min)
  const charity = revenue * 0.1;
  setTotalCharity(charity);
};


  // ================= SIMULATION =================
  const simulateDraw = () => {
    const nums = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    toast(`Simulation: ${nums.join(", ")}`);
  };

  // ================= RUN DRAW =================
  const runDraw = async () => {
    const drawNumbers = Array.from({ length: 5 }, () =>
      Math.floor(Math.random() * 45) + 1
    );

    const { data: drawsData } = await supabase.from("draws").select("*");

    if (!drawsData || drawsData.length === 0) {
      return toast.error("No participants ❌");
    }

    const { data: users } = await supabase.from("profiles").select("*");

    const activeUsers = (users || []).filter(
      (u) => u.subscription_status === "active"
    );

    // 🔥 GET OLD JACKPOT
const { data: settings } = await supabase
  .from("settings")
  .select("*")
  .eq("id", 1)
  .maybeSingle();

let jackpot = settings?.jackpot_pool || 0;

// 🔥 FINAL POOL
const totalPool = activeUsers.length * 99 + jackpot;

    let winners5 = [];
    let winners4 = [];
    let winners3 = [];

    // 🔥 FIRST LOOP → MATCH CALCULATION
    for (let d of drawsData) {
      const userNumbers = (d.numbers || "")
        .split(",")
        .map((n) => Number(n.trim()));

      const matchCount = userNumbers.filter((n) =>
        drawNumbers.includes(n)
      ).length;

      if (matchCount === 5) winners5.push(d);
      else if (matchCount === 4) winners4.push(d);
      else if (matchCount === 3) winners3.push(d);

      await supabase
        .from("draws")
        .update({
          matches: matchCount,
        })
        .eq("id", d.id);
    }

    // 🔥 PRIZE SPLIT
    const prize5 = Math.floor((totalPool * 0.4) / (winners5.length || 1));
    const prize4 = Math.floor((totalPool * 0.35) / (winners4.length || 1));
    const prize3 = Math.floor((totalPool * 0.25) / (winners3.length || 1));

    // 🔥 SECOND LOOP → RESULT UPDATE
    for (let d of drawsData) {
      let result = "😢 No Win";
      let prize = 0;

      if (winners5.some((w) => w.id === d.id)) {
        result = "🥇 Jackpot";
        prize = prize5;
      } else if (winners4.some((w) => w.id === d.id)) {
        result = "🥈 4 Matches";
        prize = prize4;
      } else if (winners3.some((w) => w.id === d.id)) {
        result = "🥉 3 Matches";
        prize = prize3;
      }

      await supabase
        .from("draws")
        .update({
          result: `${result} | Prize: ₹${prize}`,
        })
        .eq("id", d.id);
    }

    // 🔥 JACKPOT MESSAGE
    if (winners5.length === 0) {
  // 🔥 SAVE FULL POOL FOR NEXT TIME
  await supabase
    .from("settings")
    .upsert({ id: 1, jackpot_pool: totalPool });

  toast(`No jackpot winner — ₹${totalPool} rolled over 🔁`);
} else {
  // 🔥 RESET JACKPOT
  await supabase
    .from("settings")
    .upsert({ id: 1, jackpot_pool: 0 });

  toast("Jackpot won! Pool reset 🎉");
}

    toast.success("Draw completed 🎯");

    fetchDraws();
    fetchSubscribers();
  };

  // ================= VERIFY =================
  const verifyWinner = async (id, status) => {
    await supabase
      .from("draws")
      .update({
        verification_status: status,
        payment_status: status === "approved" ? "paid" : "rejected",
      })
      .eq("id", id);

    toast.success("Updated ✅");
    fetchDraws();
  };

  // ================= DELETE =================
  const deleteUserData = async (user_id) => {
    if (!window.confirm("Delete user data?")) return;

    await Promise.all([
      supabase.from("scores").delete().eq("user_id", user_id),
      supabase.from("draws").delete().eq("user_id", user_id),
    ]);

    toast.success("Deleted ❌");
    window.location.reload();
    fetchDraws();
    fetchUsersCount();
    fetchSubscribers();
    fetchCharities();
    fetchUsers();
    fetchAnalytics();
  };

  // ================= ADMIN CHECK =================
  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (data?.role === "admin") {
      setIsAdmin(true);

      await Promise.all([
        fetchDraws(),
        fetchUsersCount(),
        fetchSubscribers(),
        fetchUsers(),
        fetchCharities(),
        fetchAnalytics(),
        fetchDeletedUsers(),
      ]);
    }

    setLoading(false);
  };

  useEffect(() => {
    checkAdmin();
  }, []);

  if (loading) return <h1 className="text-center mt-10">Loading...</h1>;

  if (!isAdmin)
    return (
      <h1 className="text-center mt-10 text-red-500">
        Access Denied ❌
      </h1>
    );

  // ================= UI =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20"
      >

        <h1 className="text-3xl font-bold text-white mb-4">
          🧑‍💻 Admin Dashboard
        </h1>

        {/* BUTTONS */}
        {/* BUTTONS */}
<div className="flex gap-3 mb-4">

  <button
    className="bg-pink-500 text-white px-4 py-2 rounded-xl shadow"
    onClick={runDraw}
  >
    Run Monthly Draw 🎯
  </button>

  <button
    onClick={simulateDraw}
    className="bg-orange-400 text-white px-4 py-2 rounded-xl shadow"
  >
    Simulate 🧪
  </button>

</div>

        {/* STATS */}
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-white">

  <div className="bg-white/20 p-4 rounded-xl text-center">
    👤 Users
    <p className="text-xl font-bold">{usersCount}</p>
  </div>

  <div className="bg-white/20 p-4 rounded-xl text-center">
    🎯 Draws
    <p className="text-xl font-bold">{draws.length}</p>
  </div>

  <div className="bg-white/20 p-4 rounded-xl text-center">
    💎 Subscribers
    <p className="text-xl font-bold">{subscribers}</p>
  </div>

  <div className="bg-white/20 p-4 rounded-xl text-center">
    💰 Revenue
    <p className="text-xl font-bold">₹{revenue}</p>
  </div>

  <div className="bg-white/20 p-4 rounded-xl text-center"> 
    🏆 Prize Pool
    <p className="text-xl font-bold">₹{prizePool}</p>
  </div>
<div className="bg-white/20 p-4 rounded-xl text-center">
  💰 Total Revenue
  <p className="text-xl font-bold">₹{totalRevenue}</p>
</div>

<div className="bg-white/20 p-4 rounded-xl text-center">
  ❤️ Charity Contribution
  <p className="text-xl font-bold">₹{totalCharity}</p>
</div>
</div>

        {/* DRAWS */}
        <ul className="space-y-2">
          {draws.map((d) => (
            <li
  key={d.id}
  className="bg-white/20 text-white p-4 rounded-xl flex justify-between items-center shadow-md hover:scale-[1.01] transition">
  <div>
    <p className="font-semibold">
      🎯 {d.numbers} | Matches: {d.matches}
    </p>

    <p className="text-sm mt-1">
      Status:
      <span
        className={
          d.verification_status === "approved"
            ? "text-green-400 ml-1"
            : d.verification_status === "rejected"
            ? "text-red-400 ml-2"
            : "text-yellow-300 ml-2"
        }
      >
        {d.verification_status || "pending"}
      </span>
    </p>

    <div className="mt-2 flex gap-2 items-center">

      {d.proof_url && (
        <a
          href={d.proof_url}
          target="_blank"
          className="text-sm underline"
        >
          📸 View
        </a>
      )}

      <button
        className="bg-green-500 px-3 py-1 rounded text-sm"
        onClick={() => verifyWinner(d.id, "approved")}
      >
        Approve
      </button>

      <button
        className="bg-red-500 px-3 py-1 rounded text-sm"
        onClick={() => verifyWinner(d.id, "rejected")}
      >
        Reject
      </button>

    </div>
  </div>

  <button
    className="bg-red-500 px-4 py-2 rounded-lg text-sm"
    onClick={() => deleteDraw(d.id)}
  >
    Delete ❌
  </button>
</li>
          ))}
        </ul>
      <h2 className="text-white mt-6 text-xl">Charity Management</h2>

<div className="flex flex-col md:flex-row gap-2 mt-2">

  <input
    value={newCharity}
    onChange={(e) => setNewCharity(e.target.value)}
    placeholder="Name"
    className="p-2 rounded"
  />

  <input
    value={charityDesc}
    onChange={(e) => setCharityDesc(e.target.value)}
    placeholder="Description"
    className="p-2 rounded"
  />

  <input
    value={charityImage}
    onChange={(e) => setCharityImage(e.target.value)}
    placeholder="Image URL"
    className="p-2 rounded"
  />

  <button
  onClick={editId ? updateCharity : addCharity}
  className="bg-blue-500 px-3 py-1 text-white rounded"
>
  {editId ? "Update" : "Add"}
</button>

</div>

{charities.map((c) => (
  <div
    key={c.id}
    className="bg-white/20 p-2 mt-2 text-white flex justify-between items-center rounded"
  >
    <div>
      <b>{c.name}</b>
      <p className="text-sm">{c.description}</p>
    </div>

    <div className="flex gap-2">

      {/* Edit always */}
      <button
        onClick={() => {
          setEditId(c.id);
          setNewCharity(c.name);
          setCharityDesc(c.description);
          setCharityImage(c.image_url);
        }}
        className="bg-yellow-500 px-2 rounded"
      >
        Edit ✏️
      </button>

      {!c.is_deleted ? (
        <button
          onClick={() => deleteCharity(c.id)}
          className="bg-red-500 px-2 rounded"
        >
          Delete ❌
        </button>
      ) : (
        <>
          <button
            onClick={() => deleteCharityPermanent(c.id)}
            className="bg-red-700 px-2 rounded"
          >
            Delete Permanently ⚠️
          </button>

          <button
            onClick={() => undoCharity(c.id)}
            className="bg-green-500 px-2 rounded"
          >
            Undo ✅
          </button>
        </>
      )}

    </div>
  </div>
))}

  {/* 🔥 MAIN HEADING */}
<h2 className="text-white text-xl mt-6">User Management</h2>

{/* 🔥 ACTIVE USERS */}
<h3 className="text-white mt-4 text-lg">👤 Active Users</h3>

{users.map((u) => (
  <div
    key={u.id}
    className="bg-white/20 p-2 mt-2 text-white flex justify-between items-center rounded"
  >
    <div>
      {u.id.slice(0, 6)} <br />
      Role: {u.role || "user"}
    </div>

    <div className="flex gap-2">
      <button
        onClick={() => toggleRole(u.id, u.role)}
        className="bg-blue-500 px-2 rounded"
      >
        Toggle Role
      </button>

      <button
        onClick={() => deleteUser(u.id)}
        className="bg-red-500 px-2 rounded"
      >
        Delete ❌
      </button>
    </div>
  </div>
))}

{/* 🔥 DELETED USERS */}
<h3 className="text-white mt-6 text-lg">🗑️ Deleted Users</h3>

{deletedUsers.map((u) => (
  <div
    key={u.id}
    className="bg-red-200/20 p-2 mt-2 text-white flex justify-between items-center rounded"
  >
    <div>
      {u.id.slice(0, 6)} <br />
      (Deleted User)
    </div>

    <div className="flex gap-2">
      <button
        onClick={() => undoUser(u.id)}
        className="bg-green-500 px-2 rounded"
      >
        Undo ✅
      </button>

      <button
        onClick={() => deleteUserPermanent(u.id)}
        className="bg-red-700 px-2 rounded"
      >
        Delete Permanently ⚠️
      </button>
    </div>
  </div>
))}

{deletedUsers.length === 0 && (
  <p className="text-white mt-2">No deleted users 😅</p>
)}
      </motion.div>
    </div>
  );
}


export default Admin;