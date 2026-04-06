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
            className="bg-white/20 p-4 rounded-xl text-white cursor-pointer hover:scale-105 transition"
            onClick={() => navigate(`/charity/${c.id}`)}
          >
            {c.image_url && (
              <img
                src={c.image_url}
                alt=""
                className="w-full h-40 object-cover rounded mb-2"
              />
            )}

            <h2 className="text-xl font-bold">{c.name}</h2>
            <p className="text-sm mt-1">{c.description}</p>
          </div>
        ))}

      </div>

    </div>
  );
}

export default Charities;