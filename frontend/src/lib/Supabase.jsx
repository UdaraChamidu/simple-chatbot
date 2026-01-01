import { createClient } from '@supabase/supabase-js';

// These are safe to expose in the frontend (Anon key) - User requested service role key override
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL; 
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SERVICE_ROLE_SECRET;

export const Supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);