-- The existing production schema had the RLS policies but not the PostgREST
-- grants/functions required by the Worker. Keep reads public for the catalog;
-- write authority remains inside SECURITY DEFINER RPCs until Phase 2 JWT guards.

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
    FOR v_seat_id IN SELECT unnest(p_seat_ids) ORDER BY 1 ASC LOOP
        SELECT * INTO v_seat FROM public.seats WHERE id = v_seat_id FOR UPDATE;
        IF v_seat IS NULL THEN RAISE EXCEPTION 'Assento não encontrado.'; END IF;
        IF v_seat.status = 'sold' THEN RAISE EXCEPTION 'Assento já foi vendido.'; END IF;
        IF v_seat.status = 'locked' AND v_seat.locked_until > v_now AND v_seat.locked_by <> p_user_email THEN
            RAISE EXCEPTION 'Assento já está reservado por outro cliente.';
        END IF;
        UPDATE public.seats SET status = 'locked', locked_until = v_lock_expiration, locked_by = p_user_email WHERE id = v_seat_id;
    END LOOP;
    RETURN jsonb_build_object('success', true, 'message', 'Assentos reservados com sucesso.', 'locked_until', v_lock_expiration);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.events, public.seats TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ticket_atomic(uuid, varchar, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_tickets_batch_atomic(uuid[], text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_tickets_batch_atomic(uuid[], text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_checkout_batch_atomic(uuid[], uuid, text, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_ticket_gatekeeper(uuid, text, uuid) TO anon, authenticated;
