import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Solo para usar en Server Actions / Route Handlers. Nunca importar desde
// un componente cliente: la service role key se salta RLS por completo.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
