-- ========================================================
-- DESAFIO ELITE DEV - DATABASE SCHEMA & CONCURRENCY SYSTEM
-- ========================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. USERS / PROFILES TABLE (ROLES: Admin, Client, Gatekeeper)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'client' CHECK (role IN ('organizer', 'client', 'gatekeeper')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- 2. EVENTS & SEATS TABLES
-- --------------------------------------------------------

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES public.profiles(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    venue VARCHAR(255) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seats table
CREATE TABLE IF NOT EXISTS public.seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    row_name VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    category VARCHAR(50) DEFAULT 'Standard', -- VIP, Premium, Standard
    price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'locked', 'sold')),
    locked_until TIMESTAMPTZ,
    locked_by VARCHAR(255),
    CONSTRAINT unique_event_seat UNIQUE (event_id, row_name, seat_number)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id),
    seat_id UUID NOT NULL REFERENCES public.seats(id),
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled')),
    qr_signature TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seats_event_status ON public.seats(event_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.tickets(user_email);
CREATE INDEX IF NOT EXISTS idx_tickets_signature ON public.tickets(qr_signature);

-- --------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public read seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Allow public read tickets" ON public.tickets FOR SELECT USING (true);

-- --------------------------------------------------------
-- 4. ATOMIC PROCEDURES (PESSIMISTIC LOCKING & ENTRY VALIDATION)
-- --------------------------------------------------------

-- Procedure 1: reserve_ticket_atomic (SELECT ... FOR UPDATE)
CREATE OR REPLACE FUNCTION public.reserve_ticket_atomic(
    p_seat_id UUID,
    p_user_email VARCHAR(255),
    p_hold_minutes INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seat RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_lock_expiration TIMESTAMPTZ := NOW() + (p_hold_minutes || ' minutes')::INTERVAL;
BEGIN
    -- PESSIMISTIC LOCK: Lock target seat row for update
    SELECT * INTO v_seat
    FROM public.seats
    WHERE id = p_seat_id
    FOR UPDATE;

    IF v_seat IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Seat not found.');
    END IF;

    IF v_seat.status = 'sold' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Seat is already sold.');
    END IF;

    IF v_seat.status = 'locked' AND v_seat.locked_until > v_now AND v_seat.locked_by != p_user_email THEN
        RETURN jsonb_build_object('success', false, 'message', 'Seat is currently reserved by another user.');
    END IF;

    -- Update seat to locked
    UPDATE public.seats
    SET status = 'locked',
        locked_until = v_lock_expiration,
        locked_by = p_user_email
    WHERE id = p_seat_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Seat reserved successfully.',
        'seat_id', p_seat_id,
        'locked_until', v_lock_expiration
    );
END;
$$;

-- Procedure 2: validate_ticket_gatekeeper (Atomic Gate Entry Check)
CREATE OR REPLACE FUNCTION public.validate_ticket_gatekeeper(
    p_ticket_id UUID,
    p_qr_signature TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket RECORD;
BEGIN
    SELECT t.*, e.title as event_title, s.row_name, s.seat_number
    INTO v_ticket
    FROM public.tickets t
    JOIN public.events e ON e.id = t.event_id
    JOIN public.seats s ON s.id = t.seat_id
    WHERE t.id = p_ticket_id
    FOR UPDATE;

    IF v_ticket IS NULL THEN
        RETURN jsonb_build_object('success', false, 'valid', false, 'message', 'Ingresso não encontrado no sistema.');
    END IF;

    IF v_ticket.qr_signature != p_qr_signature THEN
        RETURN jsonb_build_object('success', false, 'valid', false, 'message', 'ASSINATURA INVÁLIDA! QR Code forjado.');
    END IF;

    IF v_ticket.status = 'used' THEN
        RETURN jsonb_build_object('success', false, 'valid', false, 'message', 'INGRESSO JÁ UTILIZADO! Entrada recusada.', 'used_at', v_ticket.used_at);
    END IF;

    IF v_ticket.status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'valid', false, 'message', 'INGRESSO CANCELADO.');
    END IF;

    -- Mark as used and update timestamp
    UPDATE public.tickets
    SET status = 'used',
        used_at = NOW()
    WHERE id = p_ticket_id;

    RETURN jsonb_build_object(
        'success', true,
        'valid', true,
        'message', 'ENTRADA LIBERADA! Ingresso válido.',
        'user_name', v_ticket.user_name,
        'event_title', v_ticket.event_title,
        'seat', v_ticket.row_name || '-' || v_ticket.seat_number
    );
END;
$$;

-- --------------------------------------------------------
-- 5. SEED DATA (Verzel Test Accounts)
-- --------------------------------------------------------

-- Profiles
INSERT INTO public.profiles (id, email, name, role) VALUES
    ('u1111111-1111-1111-1111-111111111111', 'organizador@verzel.com', 'Carlos Organizador', 'organizer'),
    ('u2222222-2222-2222-2222-222222222222', 'ana.cliente@verzel.com', 'Ana Cliente', 'client'),
    ('u3333333-3333-3333-3333-333333333333', 'bruno.cliente@verzel.com', 'Bruno Cliente', 'client'),
    ('u4444444-4444-4444-4444-444444444444', 'portaria@verzel.com', 'Roberto Portaria', 'gatekeeper')
ON CONFLICT (email) DO NOTHING;

-- 1 Demo Event
INSERT INTO public.events (id, organizer_id, title, description, venue, date, price, banner_url)
VALUES (
    'e1111111-1111-1111-1111-111111111111',
    'u1111111-1111-1111-1111-111111111111',
    'Tech Summit Elite 2026',
    'O maior evento de engenharia de software e inteligência artificial da América Latina.',
    'Arena Innovation Hub - São Paulo',
    '2026-11-20 19:00:00+00',
    299.90,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
) ON CONFLICT (id) DO NOTHING;

-- Seats (Rows A, B, C, D)
DO $$
DECLARE
    row_char TEXT;
    seat_num INT;
    price_val NUMERIC;
    cat_val TEXT;
BEGIN
    FOR row_idx IN 65..68 LOOP -- Rows A to D
        row_char := chr(row_idx);
        FOR seat_num IN 1..8 LOOP
            IF row_char = 'A' THEN
                price_val := 499.90;
                cat_val := 'VIP';
            ELSIF row_char = 'B' THEN
                price_val := 399.90;
                cat_val := 'Premium';
            ELSE
                price_val := 299.90;
                cat_val := 'Standard';
            END IF;

            INSERT INTO public.seats (event_id, row_name, seat_number, category, price, status)
            VALUES ('e1111111-1111-1111-1111-111111111111', row_char, seat_num, cat_val, price_val, 'available')
            ON CONFLICT DO NOTHING;
        END FOR;
    END LOOP;
END $$;
