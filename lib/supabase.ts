import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const rememberModeKey = "ditapaja_auth_storage_mode";

const authStorage = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    const storage = window.localStorage.getItem(rememberModeKey) === "session"
      ? window.sessionStorage
      : window.localStorage;
    return storage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    const storage = window.localStorage.getItem(rememberModeKey) === "session"
      ? window.sessionStorage
      : window.localStorage;
    storage.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

/** Select where Supabase stores its auth session before signing in. */
export function setAuthStorageMode(rememberForSevenDays: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(rememberModeKey, rememberForSevenDays ? "persistent" : "session");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: authStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
