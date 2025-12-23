import { createClient } from '@supabase/supabase-js';

// These are safe to expose in the frontend (Anon key)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL; 
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const Supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);