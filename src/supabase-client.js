import { createClient } from "@supabase/supabase-js";
import { appConfigs } from "./configs/config";

const supabaseUrl = appConfigs.SUPABASE_URL;
const supabaseAnonKey = appConfigs.SUPABASE_ANON;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
