import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zgbhmduzypqfgfuncnhl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hrXl9QKQoXC6C3ImupVfMw_wkaazz5g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured =
  !supabaseUrl.includes('your-supabase-project.supabase.co') &&
  !supabaseAnonKey.includes('your-supabase-anon-key');
