import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useParams } from "react-router-dom";

function CharityDetails() {
  const { id } = useParams();
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

  if (!charity) return <h1 className="text-center mt-10">Loading...</h1>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">

      <div className="max-w-3xl mx-auto bg-white/20 p-6 rounded-xl">

        {charity.image_url && (
          <img
            src={charity.image_url}
            className="w-full h-60 object-cover rounded mb-4"
          />
        )}

        <h1 className="text-3xl font-bold">{charity.name}</h1>

        <p className="mt-4">{charity.description}</p>

      </div>

    </div>
  );
}

export default CharityDetails;