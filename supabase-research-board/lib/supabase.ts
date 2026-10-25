// Supabase client for SERVER code only.
//
// It uses the secret key, which bypasses Row Level Security, so it must
// never reach the browser. "server-only" makes the build fail if a
// Client Component ever imports this file.
import "server-only";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SECRET_KEY. Add them to .env.local (see .env.example)."
  );
}

export const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
