BEGIN;

CREATE TABLE IF NOT EXISTS delivery_handoff_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_partner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by_profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_handoff_tokens_order_id ON delivery_handoff_tokens(order_id);

CREATE INDEX IF NOT EXISTS idx_delivery_handoff_tokens_customer_profile_id ON delivery_handoff_tokens(customer_profile_id);

CREATE INDEX IF NOT EXISTS idx_delivery_handoff_tokens_delivery_partner_id ON delivery_handoff_tokens(delivery_partner_id);

CREATE INDEX IF NOT EXISTS idx_delivery_handoff_tokens_status ON delivery_handoff_tokens(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_handoff_tokens_one_active_per_order
  ON delivery_handoff_tokens(order_id)
  WHERE status = 'active';

CREATE OR REPLACE FUNCTION private.generate_delivery_handoff_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION private.hash_delivery_handoff_token(p_token TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(
    digest(
      RIGHT(REGEXP_REPLACE(COALESCE(p_token, ''), '\D', '', 'g'), 6),
      'sha256'
    ),
    'hex'
  );
$$;

CREATE OR REPLACE FUNCTION public.issue_delivery_handoff_token(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_actor_role TEXT := public.current_app_role();
  v_token TEXT;
  v_token_hash TEXT;
  v_expiry TIMESTAMPTZ := NOW() + INTERVAL '30 minutes';
  v_revoked_count INT := 0;
  v_token_row public.delivery_handoff_tokens%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR v_actor_role <> 'customer' THEN
    RAISE EXCEPTION 'Verified customer access is required.' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND profile_id = auth.uid();

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status <> 'picked_up' THEN
    RAISE EXCEPTION 'Delivery handoff codes unlock after pickup.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.delivery_handoff_tokens
  SET
    status = CASE WHEN expires_at < NOW() THEN 'expired' ELSE 'revoked' END,
    updated_at = NOW()
  WHERE order_id = p_order_id
    AND status = 'active';

  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;

  IF v_revoked_count > 0 THEN
    PERFORM private.append_order_event(
      p_order_id => p_order_id,
      p_status => 'picked_up',
      p_event_type => 'delivery.token_revoked',
      p_previous_status => 'picked_up',
      p_title => 'Delivery handoff code replaced',
      p_detail => 'A previous delivery handoff code was invalidated before a new one was issued.',
      p_actor_id => auth.uid(),
      p_actor_role => v_actor_role,
      p_source => 'customer_handoff',
      p_metadata => jsonb_build_object(
        'revoked_count', v_revoked_count
      )
    );
  END IF;

  v_token := private.generate_delivery_handoff_token();
  v_token_hash := private.hash_delivery_handoff_token(v_token);

  INSERT INTO public.delivery_handoff_tokens (
    order_id,
    customer_profile_id,
    delivery_partner_id,
    token_hash,
    status,
    expires_at,
    metadata,
    created_at,
    updated_at
  )
  VALUES (
    p_order_id,
    auth.uid(),
    v_order.delivery_partner_id,
    v_token_hash,
    'active',
    v_expiry,
    jsonb_build_object(
      'version', 1,
      'issued_for_status', v_order.status
    ),
    NOW(),
    NOW()
  )
  RETURNING * INTO v_token_row;

  PERFORM private.append_order_event(
    p_order_id => p_order_id,
    p_status => 'picked_up',
    p_event_type => 'delivery.token_issued',
    p_previous_status => 'picked_up',
    p_title => 'Delivery handoff code issued',
    p_detail => 'A new delivery handoff code was generated for final handoff.',
    p_actor_id => auth.uid(),
    p_actor_role => v_actor_role,
    p_source => 'customer_handoff',
    p_metadata => jsonb_build_object(
      'token_id', v_token_row.id,
      'expires_at', v_expiry
    )
  );

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'token', v_token,
    'expires_at', v_expiry,
    'status', 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_delivery_order_with_token(
  p_order_id UUID,
  p_token TEXT
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_actor_role TEXT := public.current_app_role();
  v_previous_status TEXT;
  v_fresh_order public.orders%ROWTYPE;
  v_token_row public.delivery_handoff_tokens%ROWTYPE;
  v_submitted_hash TEXT;
  v_reason TEXT;
  v_error_message TEXT;
BEGIN
  IF auth.uid() IS NULL OR v_actor_role <> 'delivery_partner' THEN
    RAISE EXCEPTION 'Delivery access is required.' USING ERRCODE = '42501';
  END IF;

  IF LENGTH(RIGHT(REGEXP_REPLACE(COALESCE(p_token, ''), '\D', '', 'g'), 6)) <> 6 THEN
    RAISE EXCEPTION 'Enter a valid 6-digit delivery token.' USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.delivery_partner_id <> auth.uid() THEN
    RAISE EXCEPTION 'This order is not assigned to this delivery partner.' USING ERRCODE = '42501';
  END IF;

  v_previous_status := v_order.status;
  PERFORM private.enforce_order_transition(
    p_from_status => v_previous_status,
    p_to_status => 'delivered',
    p_actor_role => v_actor_role,
    p_action => 'delivery_complete'
  );

  UPDATE public.delivery_handoff_tokens
  SET
    status = 'expired',
    updated_at = NOW()
  WHERE order_id = p_order_id
    AND status = 'active'
    AND expires_at < NOW();

  SELECT *
  INTO v_token_row
  FROM public.delivery_handoff_tokens
  WHERE order_id = p_order_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_token_row.id IS NULL THEN
    RAISE EXCEPTION 'No delivery handoff code is active for this order.' USING ERRCODE = 'P0002';
  END IF;

  v_submitted_hash := private.hash_delivery_handoff_token(p_token);

  IF v_token_row.status <> 'active' THEN
    v_reason := CASE
      WHEN v_token_row.status = 'expired' THEN 'expired'
      WHEN v_token_row.status = 'used' THEN 'used'
      ELSE 'revoked'
    END;
    v_error_message := CASE
      WHEN v_reason = 'expired' THEN 'Delivery token expired. Ask the customer for a fresh code.'
      WHEN v_reason = 'used' THEN 'Delivery token has already been used.'
      ELSE 'Delivery token is no longer active. Ask the customer for a fresh code.'
    END;

    UPDATE public.delivery_handoff_tokens
    SET
      attempt_count = COALESCE(attempt_count, 0) + 1,
      last_attempt_at = NOW(),
      updated_at = NOW()
    WHERE id = v_token_row.id
    RETURNING * INTO v_token_row;

    PERFORM private.append_order_event(
      p_order_id => p_order_id,
      p_status => 'picked_up',
      p_event_type => 'delivery.token_verification_failed',
      p_previous_status => 'picked_up',
      p_title => 'Delivery code rejected',
      p_detail => 'The submitted delivery handoff code could not be accepted.',
      p_actor_id => auth.uid(),
      p_actor_role => v_actor_role,
      p_source => 'delivery_handoff',
      p_reason_code => v_reason,
      p_metadata => jsonb_build_object(
        'token_id', v_token_row.id,
        'attempt_count', v_token_row.attempt_count
      )
    );

    RAISE EXCEPTION '%', v_error_message USING ERRCODE = '22023';
  END IF;

  IF v_token_row.expires_at < NOW() THEN
    UPDATE public.delivery_handoff_tokens
    SET
      status = 'expired',
      attempt_count = COALESCE(attempt_count, 0) + 1,
      last_attempt_at = NOW(),
      updated_at = NOW()
    WHERE id = v_token_row.id
    RETURNING * INTO v_token_row;

    PERFORM private.append_order_event(
      p_order_id => p_order_id,
      p_status => 'picked_up',
      p_event_type => 'delivery.token_verification_failed',
      p_previous_status => 'picked_up',
      p_title => 'Delivery code expired',
      p_detail => 'The submitted delivery handoff code expired before verification.',
      p_actor_id => auth.uid(),
      p_actor_role => v_actor_role,
      p_source => 'delivery_handoff',
      p_reason_code => 'expired',
      p_metadata => jsonb_build_object(
        'token_id', v_token_row.id,
        'attempt_count', v_token_row.attempt_count
      )
    );

    RAISE EXCEPTION 'Delivery token expired. Ask the customer for a fresh code.' USING ERRCODE = '22023';
  END IF;

  IF v_token_row.token_hash <> v_submitted_hash THEN
    UPDATE public.delivery_handoff_tokens
    SET
      attempt_count = COALESCE(attempt_count, 0) + 1,
      last_attempt_at = NOW(),
      updated_at = NOW()
    WHERE id = v_token_row.id
    RETURNING * INTO v_token_row;

    PERFORM private.append_order_event(
      p_order_id => p_order_id,
      p_status => 'picked_up',
      p_event_type => 'delivery.token_verification_failed',
      p_previous_status => 'picked_up',
      p_title => 'Delivery code rejected',
      p_detail => 'The submitted delivery handoff code does not match the customer record.',
      p_actor_id => auth.uid(),
      p_actor_role => v_actor_role,
      p_source => 'delivery_handoff',
      p_reason_code => 'invalid',
      p_metadata => jsonb_build_object(
        'token_id', v_token_row.id,
        'attempt_count', v_token_row.attempt_count
      )
    );

    RAISE EXCEPTION 'That delivery token is incorrect.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.delivery_handoff_tokens
  SET
    status = 'used',
    used_at = NOW(),
    used_by_profile_id = auth.uid(),
    delivery_partner_id = auth.uid(),
    updated_at = NOW()
  WHERE id = v_token_row.id
    AND status = 'active'
  RETURNING * INTO v_token_row;

  IF v_token_row.id IS NULL THEN
    RAISE EXCEPTION 'Delivery token is no longer active. Ask the customer for a fresh code.' USING ERRCODE = '40001';
  END IF;

  PERFORM private.append_order_event(
    p_order_id => p_order_id,
    p_status => 'picked_up',
    p_event_type => 'delivery.token_verified',
    p_previous_status => 'picked_up',
    p_title => 'Delivery code verified',
    p_detail => 'The customer handoff code was verified before final completion.',
    p_actor_id => auth.uid(),
    p_actor_role => v_actor_role,
    p_source => 'delivery_handoff',
    p_metadata => jsonb_build_object(
      'token_id', v_token_row.id
    )
  );

  UPDATE public.orders
  SET
    status = 'delivered',
    delivered_at = COALESCE(delivered_at, NOW()),
    updated_at = NOW()
  WHERE id = p_order_id
    AND delivery_partner_id = auth.uid()
    AND status = v_previous_status
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    SELECT *
    INTO v_fresh_order
    FROM public.orders
    WHERE id = p_order_id;

    IF v_fresh_order.id IS NULL THEN
      RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_fresh_order.delivery_partner_id <> auth.uid() THEN
      RAISE EXCEPTION 'This order is not assigned to this delivery partner.' USING ERRCODE = '42501';
    END IF;

    PERFORM private.enforce_order_transition(
      p_from_status => v_fresh_order.status,
      p_to_status => 'delivered',
      p_actor_role => v_actor_role,
      p_action => 'delivery_complete'
    );

    RAISE EXCEPTION 'Order state changed. Refresh and try again.' USING ERRCODE = '40001';
  END IF;

  UPDATE public.delivery_assignments
  SET
    status = 'delivered',
    delivered_at = COALESCE(delivered_at, NOW()),
    updated_at = NOW()
  WHERE order_id = p_order_id;

  PERFORM private.append_order_event(
    p_order_id => p_order_id,
    p_status => 'delivered',
    p_event_type => 'delivery.delivered',
    p_previous_status => v_previous_status,
    p_title => 'Delivered',
    p_detail => 'The order was delivered to the customer.',
    p_actor_id => auth.uid(),
    p_actor_role => v_actor_role,
    p_source => 'delivery_ops',
    p_metadata => jsonb_build_object(
      'agent_profile_id', auth.uid(),
      'assignment_status', 'delivered',
      'token_id', v_token_row.id
    )
  );

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_delivery_order(p_order_id UUID)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_app_role() NOT IN ('delivery_partner', 'admin') THEN
    RAISE EXCEPTION 'Delivery access is required.' USING ERRCODE = '42501';
  END IF;
  RAISE EXCEPTION 'Delivery token required.' USING ERRCODE = '42501';
END;
$$;

ALTER TABLE delivery_handoff_tokens ENABLE ROW LEVEL SECURITY;

COMMIT;
