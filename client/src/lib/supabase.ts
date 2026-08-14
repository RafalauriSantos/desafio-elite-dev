import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://extkyeckajhcozjervyr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4dGt5ZWNrYWpoY296amVydnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjYyOTAsImV4cCI6MjA4MjcwMjI5MH0.IRkROuklqfjRwWOP4AzETFjNlGa0rD1ifYRKiIg1Wfc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured =
  !supabaseUrl.includes('your-supabase-project.supabase.co') &&
  !supabaseAnonKey.includes('your-supabase-anon-key');
