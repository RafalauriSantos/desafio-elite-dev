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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read profiles') THEN
        CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read events') THEN
        CREATE POLICY "Allow public read events" ON public.events FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read seats') THEN
        CREATE POLICY "Allow public read seats" ON public.seats FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read tickets') THEN
        CREATE POLICY "Allow public read tickets" ON public.tickets FOR SELECT USING (true);
    END IF;
END $$;

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

-- Procedure 1.1: reserve_tickets_batch_atomic (Pessimistic Locking Batch Reservation FOR UPDATE ORDER BY 1 ASC)
CREATE OR REPLACE FUNCTION public.reserve_tickets_batch_atomic(
    p_seat_ids UUID[],
    p_user_email TEXT,
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
    v_seat_id UUID;
BEGIN
    -- Sort seat IDs to strictly prevent deadlocks during concurrent multi-seat reservations
    FOR v_seat_id IN SELECT unnest(p_seat_ids) ORDER BY 1 ASC LOOP
        SELECT * INTO v_seat
        FROM public.seats
        WHERE id = v_seat_id
        FOR UPDATE;

        IF v_seat IS NULL THEN
            RAISE EXCEPTION 'Assento não encontrado.';
        END IF;

        IF v_seat.status = 'sold' THEN
            RAISE EXCEPTION 'Assento % % já foi vendido.', v_seat.row_name, v_seat.seat_number;
        END IF;

        IF v_seat.status = 'locked' AND v_seat.locked_until > v_now AND v_seat.locked_by != p_user_email THEN
            RAISE EXCEPTION 'Assento % % já está reservado por outro cliente.', v_seat.row_name, v_seat.seat_number;
        END IF;

        UPDATE public.seats
        SET status = 'locked',
            locked_until = v_lock_expiration,
            locked_by = p_user_email
        WHERE id = v_seat_id;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Assentos reservados com sucesso.',
        'locked_until', v_lock_expiration
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;

-- Procedure 1.2: release seats after a declined payment or abandoned checkout
CREATE OR REPLACE FUNCTION public.release_tickets_batch_atomic(
    p_seat_ids UUID[],
    p_user_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_released_count INT;
BEGIN
    UPDATE public.seats
    SET status = 'available',
        locked_until = NULL,
        locked_by = NULL
    WHERE id = ANY(p_seat_ids)
    AND status = 'locked'
      AND locked_by = p_user_email;

    GET DIAGNOSTICS v_released_count = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'released_seats', v_released_count);
END;
$$;

-- Procedure 1.3: finalize an approved checkout atomically
CREATE OR REPLACE FUNCTION public.complete_checkout_batch_atomic(
    p_seat_ids UUID[],
    p_event_id UUID,
    p_user_email TEXT,
    p_ticket_rows JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seat RECORD;
    v_seat_id UUID;
    v_now TIMESTAMPTZ := NOW();
    v_ticket_count INT;
BEGIN
    IF jsonb_array_length(p_ticket_rows) <> cardinality(p_seat_ids) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Quantidade de ingressos incompatível com a reserva.');
    END IF;

    -- Lock in deterministic order so concurrent checkouts cannot deadlock.
    FOR v_seat_id IN SELECT unnest(p_seat_ids) ORDER BY 1 ASC LOOP
        SELECT * INTO v_seat
        FROM public.seats
        WHERE id = v_seat_id
        FOR UPDATE;

        IF v_seat IS NULL THEN
            RETURN jsonb_build_object('success', false, 'message', 'Assento não encontrado.');
        END IF;

        IF v_seat.event_id <> p_event_id THEN
            RETURN jsonb_build_object('success', false, 'message', 'Assento não pertence ao evento informado.');
        END IF;

        IF v_seat.status <> 'locked'
           OR v_seat.locked_by <> p_user_email
           OR v_seat.locked_until IS NULL
           OR v_seat.locked_until <= v_now THEN
            RETURN jsonb_build_object('success', false, 'message', 'A reserva expirou ou não pertence a este comprador.');
        END IF;
    END LOOP;

    UPDATE public.seats
    SET status = 'sold',
        locked_until = NULL,
        locked_by = NULL
    WHERE id = ANY(p_seat_ids);

    INSERT INTO public.tickets (id, event_id, seat_id, user_email, user_name, status, qr_signature, created_at)
    SELECT
        (item->>'id')::UUID,
        (item->>'event_id')::UUID,
        (item->>'seat_id')::UUID,
        item->>'user_email',
        item->>'user_name',
        COALESCE(item->>'status', 'valid'),
        item->>'qr_signature',
        COALESCE((item->>'created_at')::TIMESTAMPTZ, NOW())
    FROM jsonb_array_elements(p_ticket_rows) AS item;

    GET DIAGNOSTICS v_ticket_count = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'tickets_created', v_ticket_count);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Procedure 2: validate_ticket_gatekeeper (Atomic Gate Entry Check: VALID, ALREADY_USED, INVALID, WRONG_EVENT)
CREATE OR REPLACE FUNCTION public.validate_ticket_gatekeeper(
    p_ticket_id UUID,
    p_qr_signature TEXT,
    p_target_event_id UUID DEFAULT NULL
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
        RETURN jsonb_build_object(
            'success', false,
            'valid', false,
            'code', 'INVALID',
            'message', 'Ingresso não encontrado no sistema.'
        );
    END IF;

    IF v_ticket.qr_signature != p_qr_signature THEN
        RETURN jsonb_build_object(
            'success', false,
            'valid', false,
            'code', 'INVALID',
            'message', 'ASSINATURA INVÁLIDA! QR Code forjado.'
        );
    END IF;

    -- Check WRONG_EVENT
    IF p_target_event_id IS NOT NULL AND v_ticket.event_id != p_target_event_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'valid', false,
            'code', 'WRONG_EVENT',
            'message', 'INGRESSO DE OUTRO EVENTO! Este ingresso pertence a: ' || v_ticket.event_title,
            'ticket_event', v_ticket.event_title
        );
    END IF;

    -- Check ALREADY_USED
    IF v_ticket.status = 'used' THEN
        RETURN jsonb_build_object(
            'success', false,
            'valid', false,
            'code', 'ALREADY_USED',
            'message', 'INGRESSO JÁ UTILIZADO! Entrada recusada.',
            'used_at', v_ticket.used_at
        );
    END IF;

    IF v_ticket.status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'valid', false,
            'code', 'INVALID',
            'message', 'INGRESSO CANCELADO.'
        );
    END IF;

    -- Mark as used and update timestamp
    UPDATE public.tickets
    SET status = 'used',
        used_at = NOW()
    WHERE id = p_ticket_id;

    RETURN jsonb_build_object(
        'success', true,
        'valid', true,
        'code', 'VALID',
        'message', 'ENTRADA LIBERADA! Ingresso válido.',
        'user_name', v_ticket.user_name,
        'event_title', v_ticket.event_title,
        'seat', v_ticket.row_name || '-' || v_ticket.seat_number
    );
END;
$$;

-- Procedure 3: get_public_ticket_by_id (Shared Ticket Public View via Link)
CREATE OR REPLACE FUNCTION public.get_public_ticket_by_id(p_ticket_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', t.id,
        'event_id', t.event_id,
        'seat_id', t.seat_id,
        'user_email', t.user_email,
        'user_name', t.user_name,
        'status', t.status,
        'qr_signature', t.qr_signature,
        'created_at', t.created_at,
        'used_at', t.used_at,
        'events', row_to_json(e),
        'seats', row_to_json(s)
    )
    INTO v_result
    FROM public.tickets t
    JOIN public.events e ON e.id = t.event_id
    JOIN public.seats s ON s.id = t.seat_id
    WHERE t.id = p_ticket_id;

    RETURN v_result;
END;
$$;

-- Procedure 4: create_event_with_seats_atomic (Organizador - Criação Atômica com 80 Assentos)
CREATE OR REPLACE FUNCTION public.create_event_with_seats_atomic(
    p_title TEXT,
    p_description TEXT,
    p_venue TEXT,
    p_date TIMESTAMPTZ,
    p_price NUMERIC,
    p_banner_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event RECORD;
    v_row TEXT;
    v_num INT;
    v_cat TEXT;
    v_seat_price NUMERIC(10,2);
    v_status TEXT;
BEGIN
    INSERT INTO public.events (title, description, venue, date, price, banner_url)
    VALUES (p_title, p_description, p_venue, p_date, p_price, p_banner_url)
    RETURNING * INTO v_event;

    FOREACH v_row IN ARRAY ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] LOOP
      FOR v_num IN 1..10 LOOP
        IF v_row IN ('A', 'B') THEN
          v_cat := 'VIP';
          v_seat_price := 499.90;
        ELSIF v_row IN ('C', 'D') THEN
          v_cat := 'Premium';
          v_seat_price := 349.90;
        ELSE
          v_cat := 'Standard';
          v_seat_price := 199.90;
        END IF;

        IF (v_row = 'A' AND v_num = 4) OR (v_row = 'B' AND v_num = 7) OR (v_row = 'D' AND v_num = 3) THEN
          v_status := 'sold';
        ELSIF (v_row = 'C' AND v_num = 8) THEN
          v_status := 'locked';
        ELSE
          v_status := 'available';
        END IF;

        INSERT INTO public.seats (event_id, row_name, seat_number, category, price, status)
        VALUES (v_event.id, v_row, v_num, v_cat, v_seat_price, v_status);
      END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'event', row_to_json(v_event)
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- --------------------------------------------------------
-- 5. SEED DATA (Verzel Test Accounts, 4 Events & 80 Seats Each)
-- --------------------------------------------------------

-- Profiles
INSERT INTO public.profiles (id, email, name, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'organizador@verzel.com', 'Carlos Organizador', 'organizer'),
    ('22222222-2222-2222-2222-222222222222', 'ana.cliente@verzel.com', 'Ana Cliente', 'client'),
    ('33333333-3333-3333-3333-333333333333', 'bruno.cliente@verzel.com', 'Bruno Cliente', 'client'),
    ('44444444-4444-4444-4444-444444444444', 'portaria@verzel.com', 'Roberto Portaria', 'gatekeeper')
ON CONFLICT (id) DO NOTHING;

-- 4 Rich Events
INSERT INTO public.events (id, organizer_id, title, description, venue, date, price, banner_url) VALUES
    ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Tech Summit Elite 2026', 'O maior evento de engenharia de software e inteligência artificial da América Latina.', 'Arena Innovation Hub - São Paulo', '2026-11-20 19:00:00+00', 299.90, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'),
    ('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'CyberSecurity World Expo', 'Encontro global de cibersegurança, criptografia pós-quântica e defesa de infraestrutura.', 'Expo Center Norte - São Paulo, SP', '2026-12-05 14:00:00+00', 349.00, 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80'),
    ('e3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Neon Pulse Music & Visuals', 'Festival audiovisual imersivo com sintetizadores analógicos e projeção 360 graus.', 'Allianz Parque - São Paulo, SP', '2026-12-31 21:00:00+00', 190.00, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'),
    ('e4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Sinfonia Cinema & Games 2026', 'Orquestra filarmônica executando as trilhas sonoras mais épicas do cinema e dos videogames.', 'Sala São Paulo - São Paulo, SP', '2026-10-18 20:00:00+00', 180.00, 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80')
ON CONFLICT (id) DO NOTHING;

-- Seed 80 Seats (A1..H10) for ALL 4 events
DO $$
DECLARE
    v_evt RECORD;
    v_row TEXT;
    v_num INT;
    v_cat TEXT;
    v_price NUMERIC(10,2);
    v_status TEXT;
BEGIN
    FOR v_evt IN SELECT id FROM public.events LOOP
        FOREACH v_row IN ARRAY ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] LOOP
            FOR v_num IN 1..10 LOOP
                IF v_row IN ('A', 'B') THEN
                    v_cat := 'VIP';
                    v_price := 499.90;
                ELSIF v_row IN ('C', 'D') THEN
                    v_cat := 'Premium';
                    v_price := 349.90;
                ELSE
                    v_cat := 'Standard';
                    v_price := 199.90;
                END IF;

                -- Scatter ~5% sold/locked seats for realistic stadium feel
                IF (v_row = 'A' AND v_num = 4) OR (v_row = 'B' AND v_num = 7) OR (v_row = 'D' AND v_num = 3) THEN
                    v_status := 'sold';
                ELSIF (v_row = 'C' AND v_num = 8) THEN
                    v_status := 'locked';
                ELSE
                    v_status := 'available';
                END IF;

                INSERT INTO public.seats (event_id, row_name, seat_number, category, price, status)
                VALUES (v_evt.id, v_row, v_num, v_cat, v_price, v_status)
                ON CONFLICT (event_id, row_name, seat_number) DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
