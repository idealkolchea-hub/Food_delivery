BEGIN;

CREATE OR REPLACE FUNCTION private.is_allowed_order_transition(
  p_from_status TEXT,
  p_to_status TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_from_status = 'pending' AND p_to_status IN ('accepted', 'cancelled') THEN true
    WHEN p_from_status = 'accepted' AND p_to_status IN ('preparing', 'cancelled') THEN true
    WHEN p_from_status = 'preparing' AND p_to_status IN ('ready', 'cancelled') THEN true
    WHEN p_from_status = 'ready' AND p_to_status IN ('picked_up', 'cancelled') THEN true
    WHEN p_from_status = 'picked_up' AND p_to_status = 'delivered' THEN true
    ELSE false
  END;
$$;


CREATE OR REPLACE FUNCTION private.enforce_order_transition(
  p_from_status TEXT,
  p_to_status TEXT,
  p_actor_role TEXT,
  p_action TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT private.is_allowed_order_transition(p_from_status, p_to_status) THEN
    RAISE EXCEPTION 'That transition is not allowed from the current order state.' USING ERRCODE = '22023';
  END IF;

  CASE p_action
    WHEN 'customer_cancel' THEN
      IF p_actor_role NOT IN ('customer', 'admin') THEN
        RAISE EXCEPTION 'Verified customer access is required.' USING ERRCODE = '42501';
      END IF;

      IF p_to_status <> 'cancelled' OR p_from_status NOT IN ('pending', 'accepted', 'preparing', 'ready') THEN
        RAISE EXCEPTION 'This order can no longer be cancelled.' USING ERRCODE = '22023';
      END IF;
    WHEN 'vendor_update' THEN
      IF p_actor_role NOT IN ('vendor', 'admin') THEN
        RAISE EXCEPTION 'Restaurant access is required.' USING ERRCODE = '42501';
      END IF;

      IF NOT (
        (p_from_status = 'pending' AND p_to_status IN ('accepted', 'cancelled'))
        OR (p_from_status = 'accepted' AND p_to_status IN ('preparing', 'cancelled'))
        OR (p_from_status = 'preparing' AND p_to_status IN ('ready', 'cancelled'))
        OR (p_from_status = 'ready' AND p_to_status = 'cancelled')
      ) THEN
        RAISE EXCEPTION 'That transition is not allowed from the current order state.' USING ERRCODE = '22023';
      END IF;
    WHEN 'delivery_pickup' THEN
      IF p_actor_role NOT IN ('delivery_partner', 'admin') THEN
        RAISE EXCEPTION 'Delivery access is required.' USING ERRCODE = '42501';
      END IF;

      IF p_from_status <> 'ready' OR p_to_status <> 'picked_up' THEN
        RAISE EXCEPTION 'Only ready orders can be picked up.' USING ERRCODE = '22023';
      END IF;
    WHEN 'delivery_complete' THEN
      IF p_actor_role NOT IN ('delivery_partner', 'admin') THEN
        RAISE EXCEPTION 'Delivery access is required.' USING ERRCODE = '42501';
      END IF;

      IF p_from_status <> 'picked_up' OR p_to_status <> 'delivered' THEN
        RAISE EXCEPTION 'Only picked-up orders can be completed.' USING ERRCODE = '22023';
      END IF;
    ELSE
      RAISE EXCEPTION 'Unsupported transition authority action.' USING ERRCODE = '22023';
  END CASE;
END;
$$;


CREATE OR REPLACE FUNCTION private.enforce_delivery_assignment_action(
  p_status TEXT,
  p_actor_role TEXT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_actor_role NOT IN ('delivery_partner', 'admin') THEN
    RAISE EXCEPTION 'Delivery access is required.' USING ERRCODE = '42501';
  END IF;

  IF p_status <> 'ready' THEN
    RAISE EXCEPTION 'Only ready orders can be claimed.' USING ERRCODE = '22023';
  END IF;
END;
$$;


CREATE OR REPLACE FUNCTION public.cancel_customer_order(p_order_id UUID)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_current_status TEXT;
  v_actor_role TEXT := public.current_app_role();
  v_previous_status TEXT;
  v_previous_payment_status TEXT;
  v_payment_status TEXT;
  v_detail TEXT;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND profile_id = auth.uid();

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
  END IF;

  v_previous_status := v_order.status;
  v_previous_payment_status := v_order.payment_status;
  PERFORM private.enforce_order_transition(
    p_from_status => v_previous_status,
    p_to_status => 'cancelled',
    p_actor_role => v_actor_role,
    p_action => 'customer_cancel'
  );

  v_payment_status := CASE WHEN v_order.payment_status = 'paid' THEN 'refunded' ELSE v_order.payment_status END;
  v_detail := CASE
    WHEN v_payment_status = 'refunded' THEN 'Your demo payment has been marked for refund.'
    ELSE 'The order was cancelled before dispatch.'
  END;

  UPDATE public.orders
  SET
    status = 'cancelled',
    payment_status = v_payment_status,
    updated_at = NOW()
  WHERE id = p_order_id
    AND profile_id = auth.uid()
    AND status = v_previous_status
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    SELECT status
    INTO v_current_status
    FROM public.orders
    WHERE id = p_order_id
      AND profile_id = auth.uid();

    IF v_current_status IS NULL THEN
      RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
    END IF;

    RAISE EXCEPTION 'Order state changed. Refresh and try again.' USING ERRCODE = '40001';
  END IF;

  PERFORM private.append_order_event(
    p_order_id => p_order_id,
    p_status => 'cancelled',
    p_event_type => 'order.cancelled',
    p_previous_status => v_previous_status,
    p_title => 'Order cancelled',
    p_detail => v_detail,
    p_actor_id => auth.uid(),
    p_actor_role => public.current_app_role(),
    p_source => 'customer_cancel',
    p_reason_code => 'customer_requested',
    p_metadata => jsonb_build_object(
      'payment_status_before', v_previous_payment_status,
      'payment_status_after', v_payment_status
    )
  );

  RETURN v_order;
END;
$$;


CREATE OR REPLACE FUNCTION public.restaurant_update_order_status(
  p_order_id UUID,
  p_target_status TEXT,
  p_detail TEXT DEFAULT NULL,
  p_reason_code TEXT DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_current_status TEXT;
  v_actor_role TEXT := public.current_app_role();
  v_previous_status TEXT;
  v_previous_payment_status TEXT;
  v_next_status TEXT;
  v_title TEXT;
  v_detail TEXT;
  v_payment_status TEXT;
  v_event_type TEXT;
BEGIN
  IF auth.uid() IS NULL OR v_actor_role NOT IN ('vendor', 'admin') THEN
    RAISE EXCEPTION 'Restaurant access is required.' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_restaurant_member(v_order.restaurant_id) THEN
    RAISE EXCEPTION 'You do not have access to this restaurant order.' USING ERRCODE = '42501';
  END IF;

  v_previous_status := v_order.status;
  v_previous_payment_status := v_order.payment_status;
  v_next_status := CASE
    WHEN p_target_status IN ('accepted', 'preparing', 'ready', 'cancelled') THEN p_target_status
    ELSE NULL
  END;

  IF v_next_status IS NULL THEN
    RAISE EXCEPTION 'Unsupported restaurant status transition.' USING ERRCODE = '22023';
  END IF;

  IF v_order.status = v_next_status THEN
    RETURN v_order;
  END IF;

  PERFORM private.enforce_order_transition(
    p_from_status => v_previous_status,
    p_to_status => v_next_status,
    p_actor_role => v_actor_role,
    p_action => 'vendor_update'
  );

  IF v_order.status = 'pending' AND v_next_status = 'accepted' THEN
    v_title := 'Order accepted';
    v_detail := COALESCE(NULLIF(TRIM(p_detail), ''), 'The restaurant has accepted your order.');
    v_event_type := 'restaurant.accepted';
  ELSIF v_order.status = 'accepted' AND v_next_status = 'preparing' THEN
    v_title := 'Kitchen is preparing';
    v_detail := COALESCE(NULLIF(TRIM(p_detail), ''), 'The kitchen has started preparing your order.');
    v_event_type := 'restaurant.preparing';
  ELSIF v_order.status = 'preparing' AND v_next_status = 'ready' THEN
    v_title := 'Packed and ready';
    v_detail := COALESCE(NULLIF(TRIM(p_detail), ''), 'The order is packed and ready for delivery pickup.');
    v_event_type := 'restaurant.ready';
  ELSIF v_order.status IN ('pending', 'accepted', 'preparing', 'ready') AND v_next_status = 'cancelled' THEN
    v_title := 'Order rejected';
    v_detail := COALESCE(NULLIF(TRIM(p_detail), ''), 'The restaurant could not fulfill this order.');
    v_event_type := 'restaurant.cancelled';
  END IF;

  v_payment_status := CASE
    WHEN v_next_status = 'cancelled' AND v_order.payment_status = 'paid' THEN 'refunded'
    ELSE v_order.payment_status
  END;

  UPDATE public.orders
  SET
    status = v_next_status,
    payment_status = v_payment_status,
    accepted_at = CASE WHEN v_next_status = 'accepted' THEN COALESCE(accepted_at, NOW()) ELSE accepted_at END,
    preparing_at = CASE WHEN v_next_status = 'preparing' THEN COALESCE(preparing_at, NOW()) ELSE preparing_at END,
    ready_at = CASE WHEN v_next_status = 'ready' THEN COALESCE(ready_at, NOW()) ELSE ready_at END,
    updated_at = NOW()
  WHERE id = p_order_id
    AND status = v_previous_status
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    SELECT status
    INTO v_current_status
    FROM public.orders
    WHERE id = p_order_id;

    IF v_current_status IS NULL THEN
      RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
    END IF;

    RAISE EXCEPTION 'Order state changed. Refresh and try again.' USING ERRCODE = '40001';
  END IF;

  PERFORM private.append_order_event(
    p_order_id => p_order_id,
    p_status => v_next_status,
    p_event_type => v_event_type,
    p_previous_status => v_previous_status,
    p_title => v_title,
    p_detail => v_detail,
    p_actor_id => auth.uid(),
    p_actor_role => v_actor_role,
    p_source => 'vendor_ops',
    p_reason_code => p_reason_code,
    p_metadata => jsonb_strip_nulls(jsonb_build_object(
      'detail_override', NULLIF(TRIM(p_detail), ''),
      'payment_status_before', v_previous_payment_status,
      'payment_status_after', v_payment_status
    ))
  );

  RETURN v_order;
END;
$$;


CREATE OR REPLACE FUNCTION public.claim_delivery_order(p_order_id UUID)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_actor_role TEXT := public.current_app_role();
  v_fresh_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR v_actor_role NOT IN ('delivery_partner', 'admin') THEN
    RAISE EXCEPTION 'Delivery access is required.' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
  END IF;

  PERFORM private.enforce_delivery_assignment_action(v_order.status, v_actor_role);

  IF v_order.delivery_partner_id IS NOT NULL AND v_order.delivery_partner_id <> auth.uid() THEN
    RAISE EXCEPTION 'This order is already claimed by another delivery partner.' USING ERRCODE = '22023';
  END IF;

  IF v_order.delivery_partner_id = auth.uid() THEN
    RETURN v_order;
  END IF;

  UPDATE public.orders
  SET
    delivery_partner_id = auth.uid(),
    updated_at = NOW()
  WHERE id = p_order_id
    AND status = 'ready'
    AND (delivery_partner_id IS NULL OR delivery_partner_id = auth.uid())
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    SELECT *
    INTO v_fresh_order
    FROM public.orders
    WHERE id = p_order_id;

    IF v_fresh_order.id IS NULL THEN
      RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
    END IF;

    PERFORM private.enforce_delivery_assignment_action(v_fresh_order.status, v_actor_role);

    IF v_fresh_order.delivery_partner_id IS NOT NULL AND v_fresh_order.delivery_partner_id <> auth.uid() THEN
      RAISE EXCEPTION 'This order is already claimed by another delivery partner.' USING ERRCODE = '22023';
    END IF;

    IF v_fresh_order.delivery_partner_id = auth.uid() THEN
      RETURN v_fresh_order;
    END IF;

    RAISE EXCEPTION 'Order state changed. Refresh and try again.' USING ERRCODE = '40001';
  END IF;

  INSERT INTO public.delivery_assignments (
    order_id,
    agent_profile_id,
    status,
    assigned_at,
    created_at,
    updated_at
  )
  VALUES (
    p_order_id,
    auth.uid(),
    'assigned',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (order_id) DO UPDATE
  SET
    agent_profile_id = EXCLUDED.agent_profile_id,
    status = EXCLUDED.status,
    assigned_at = COALESCE(public.delivery_assignments.assigned_at, EXCLUDED.assigned_at),
    updated_at = NOW();

  PERFORM private.append_order_event(
    p_order_id => p_order_id,
    p_status => 'ready',
    p_event_type => 'delivery.assigned',
    p_previous_status => 'ready',
    p_title => 'Delivery partner assigned',
    p_detail => 'A delivery partner has claimed the order and is heading to the restaurant.',
    p_actor_id => auth.uid(),
    p_actor_role => v_actor_role,
    p_source => 'delivery_ops',
    p_metadata => jsonb_build_object(
      'agent_profile_id', auth.uid(),
      'assignment_status', 'assigned'
    )
  );

  RETURN v_order;
END;
$$;


CREATE OR REPLACE FUNCTION public.pickup_delivery_order(p_order_id UUID)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_actor_role TEXT := public.current_app_role();
  v_previous_status TEXT;
  v_fresh_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR v_actor_role NOT IN ('delivery_partner', 'admin') THEN
    RAISE EXCEPTION 'Delivery access is required.' USING ERRCODE = '42501';
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
    p_to_status => 'picked_up',
    p_actor_role => v_actor_role,
    p_action => 'delivery_pickup'
  );

  UPDATE public.orders
  SET
    status = 'picked_up',
    picked_up_at = COALESCE(picked_up_at, NOW()),
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
      p_to_status => 'picked_up',
      p_actor_role => v_actor_role,
      p_action => 'delivery_pickup'
    );

    RAISE EXCEPTION 'Order state changed. Refresh and try again.' USING ERRCODE = '40001';
  END IF;

  UPDATE public.delivery_assignments
  SET
    status = 'picked_up',
    picked_up_at = COALESCE(picked_up_at, NOW()),
    updated_at = NOW()
  WHERE order_id = p_order_id;

  PERFORM private.append_order_event(
    p_order_id => p_order_id,
    p_status => 'picked_up',
    p_event_type => 'delivery.picked_up',
    p_previous_status => v_previous_status,
    p_title => 'Picked up',
    p_detail => 'The delivery partner has collected the order from the restaurant.',
    p_actor_id => auth.uid(),
    p_actor_role => v_actor_role,
    p_source => 'delivery_ops',
    p_metadata => jsonb_build_object(
      'agent_profile_id', auth.uid(),
      'assignment_status', 'picked_up'
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
DECLARE
  v_order public.orders%ROWTYPE;
  v_actor_role TEXT := public.current_app_role();
  v_previous_status TEXT;
  v_fresh_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR v_actor_role NOT IN ('delivery_partner', 'admin') THEN
    RAISE EXCEPTION 'Delivery access is required.' USING ERRCODE = '42501';
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
      'assignment_status', 'delivered'
    )
  );

  RETURN v_order;
END;
$$;


COMMIT;
