import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export type Supabase = SupabaseClient<Database>;

export type { AdminSupabase, SessionSupabase } from "./admin-brand";
