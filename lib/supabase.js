import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gjfyiqdpysudxfiodvbf.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);