import { createClient } from "@supabase/supabase-js";

// Mesmo projeto Supabase do app (ddndpnibptrvurabacgi). A anon key é pública e
// protegida por RLS. storageKey próprio para não colidir com a sessão do app cliente.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) || "https://ddndpnibptrvurabacgi.supabase.co";
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbmRwbmlicHRydnVyYWJhY2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTUzNDUsImV4cCI6MjA5ODc3MTM0NX0.keVTayQUNOlyfg-AhmrPphbRMhv6DBygMQof_CB6Bn8";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "maislead-admin-auth",
  },
});
