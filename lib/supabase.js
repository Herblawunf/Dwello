import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gjfyiqdpysudxfiodvbf.supabase.co';
const supabaseAnonKey = process.env.SUPAVASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);