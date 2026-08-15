export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  HMAC_SECRET: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  ENVIRONMENT?: string;
};

export type AppRole = 'organizer' | 'client' | 'gatekeeper';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  price: number;
  banner_url: string;
  organizer_id?: string;
  created_at?: string;
}

export interface SeatItem {
  id: string;
  event_id: string;
  row_name: string;
  seat_number: number;
  category: string;
  price: number;
  status: 'available' | 'locked' | 'sold';
  locked_until?: string | null;
  locked_by?: string | null;
}
