import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

function Charities() {
  const [charities, setCharities] = useState([]);
  const navigate = useNavigate();

  const fetchCharities = async () => {
    const { data } = await supabase.from("charities").select("*");
    setCharities(data || []);
  };

  useEffect(() => {
    fetchCharities();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">

      <h1 className="text-3xl text-white mb-6 text-center">
        ❤️ Charities
      </h1>

      <div className="grid md:grid-cols-3 gap-4">

        {charities.map((c) => (
  <div
    key={c.id}
    className="bg-white/10 backdrop-blur-md p-4 rounded-xl shadow-md hover:scale-[1.02] transition"
  >
    
    {/* 🖼️ IMAGE (PREMIUM FIXED) */}
    <div className="w-full h-48 overflow-hidden rounded-lg">
      <img
        src={c.image_url}
        alt={c.name}
        className="w-full h-full object-cover object-center hover:scale-110 transition duration-300"
      />
    </div>

    {/* 📌 TEXT */}
    <h2 className="mt-3 text-lg font-semibold text-white">
      {c.name}
    </h2>

    <p className="text-sm text-gray-200">
      {c.description}
    </p>

  </div>
))}

      </div>

    </div>
  );
}

export default Charities;