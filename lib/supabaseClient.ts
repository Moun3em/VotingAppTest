import { createClient } from '@supabase/supabase-js';

// process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.SUPABASE_SERVICE_ROLE_KEY
// should be set in .env.local

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for backend admin tasks if needed, or anon for client

export const supabase = createClient(supabaseUrl, supabaseKey);
