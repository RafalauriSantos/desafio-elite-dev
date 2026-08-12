-- Phase 1: release a declined checkout and finalize an approved batch atomically.
-- These functions intentionally preserve the existing API contract while making
-- the multi-seat transition transactional in Supabase.

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
    SET status = 'sold', locked_until = NULL, locked_by = NULL
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
