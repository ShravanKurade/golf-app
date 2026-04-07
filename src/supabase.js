import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zjyhtmlzcyipcdcafmqo.supabase.co";
const supabaseKey = "sb_publishable_0njl2d_5sRgJNPrGvW1Rjg_QjjXrrmB";
export const supabase = createClient(supabaseUrl, supabaseKey);