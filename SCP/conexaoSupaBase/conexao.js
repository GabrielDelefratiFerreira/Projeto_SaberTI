const SUPABASE_URL = "https://bbphzdnivlifviemxgff.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5DZjx6V6Cp68QRaFp-xE3g_u_lGR-CC";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);