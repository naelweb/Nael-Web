import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let client = null;

// Ensure variables are defined and URL is a valid HTTPS link before initializing
if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://')) {
    try {
        client = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
        console.error("Failed to initialize Supabase client:", err);
    }
}

export const supabase = client;

if (!supabase) {
    console.warn("Supabase credentials missing or invalid. App is running in Local Storage fallback mode.");
} else {
    console.log("Supabase client successfully initialized.");
}
