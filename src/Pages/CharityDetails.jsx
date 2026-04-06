import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useParams, useNavigate } from "react-router-dom";

function CharityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [charity, setCharity] = useState(null);

  const fetchCharity = async () => {
    const { data } = await supabase
      .from("charities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    setCharity(data);
  };

  useEffect(() => {
    fetchCharity();
  }, []);

  if (!charity)
    return <h1 className="text-center mt-10 text-white">Loading...</h1>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">

      <div className="max-w-3xl mx-auto bg-white/20 backdrop-blur-md p-6 rounded-xl shadow-lg">

        {/* 🔙 BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition"
        >
          ← Back
        </button>

        {charity.image_url && (
          <img
            src={charity.image_url}
            className="w-full h-60 object-cover rounded mb-4"
          />
        )}

        <h1 className="text-3xl font-bold">{charity.name}</h1>

        <p className="mt-4 text-gray-200">{charity.description}</p>

        {/* ❤️ BONUS BUTTON */}
        <button className="mt-6 bg-pink-500 px-4 py-2 rounded hover:bg-pink-600 transition">
          ❤️ Donate Now
        </button>

      </div>

    </div>
  );
}

export default CharityDetails;