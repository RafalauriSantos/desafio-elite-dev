export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  HMAC_SECRET: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  TMDB_API_KEY?: string;
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

export interface TicketRow {
  id: string;
  event_id: string;
  seat_id: string;
  user_email: string;
  user_name: string;
  clientId: string;
  issuedAt: number;
  status: 'valid' | 'used' | 'cancelled';
  qr_signature: string;
  created_at: string;
  used_at?: string | null;
  events?: EventItem;
  seats?: SeatItem;
}

export interface GatekeeperValidationResult {
  success: boolean;
  valid: boolean;
  code: 'VALID' | 'ALREADY_USED' | 'INVALID' | 'WRONG_EVENT';
  message?: string;
  error?: string;
  user_name?: string;
  event_title?: string;
  seat?: string;
  used_at?: string;
  ticket_event?: string;
}
