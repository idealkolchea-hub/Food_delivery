-- ============================================================
-- BiteBlast — Shared Backend / Domain Hardening
-- Run this after:
--   1. supabase-schema.sql
--   2. supabase-cart-schema.sql
--   3. supabase-support-schema.sql
--   4. supabase-customer-platform-schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Shared Identity Backbone ──────────────────────────────────

CREATE TABLE IF NOT EXISTS app_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'guest'
    CHECK (role IN ('guest', 'customer', 'restaurant_staff', 'restaurant_owner', 'agent', 'admin')),
  phone TEXT UNIQUE,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  is_guest BOOLEAN NOT NULL DEFAULT true,
  verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE customers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'guest'
    CHECK (role IN ('guest', 'customer', 'restaurant_staff', 'restaurant_owner', 'agent', 'admin')),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS profile_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS owner_profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE addresses
  ADD COLUMN IF NOT EXISTS contact_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS profile_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE wallet_txns
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE ratings
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE carts
  ADD COLUMN IF NOT EXISTS profile_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  token TEXT UNIQUE,
  role TEXT DEFAULT 'guest'
    CHECK (role IN ('guest', 'customer', 'restaurant_staff', 'restaurant_owner', 'agent', 'admin')),
  is_guest BOOLEAN NOT NULL DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'login' CHECK (purpose IN ('login', 'checkout')),
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  session_id UUID REFERENCES customer_sessions(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  method TEXT NOT NULL CHECK (method IN ('upi', 'card', 'wallet', 'cod')),
  provider TEXT NOT NULL DEFAULT 'biteblast_demo',
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'processing', 'succeeded', 'failed', 'cancelled')),
  reference TEXT,
  failure_reason TEXT,
  checkout_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL
    CHECK (status IN (
      'pending','confirmed','preparing','ready_for_pickup',
      'agent_assigned','picked_up','in_transit',
      'delivered','cancelled','refunded'
    )),
  title TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE support_tickets
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE customer_sessions
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE otp_challenges
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE payment_intents
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE order_status_events
  ADD COLUMN IF NOT EXISTS created_by_role TEXT
    CHECK (created_by_role IN ('guest', 'customer', 'restaurant_staff', 'restaurant_owner', 'agent', 'admin', 'system')),
  ADD COLUMN IF NOT EXISTS created_by_profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS reason_code TEXT;

-- ── Shared Cross-Role Tables ──────────────────────────────────

CREATE TABLE IF NOT EXISTS restaurant_staff_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'restaurant_staff'
    CHECK (role IN ('restaurant_staff', 'restaurant_owner')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (restaurant_id, profile_id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  special_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  agent_profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'unassigned'
    CHECK (status IN ('unassigned', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  assigned_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  action TEXT NOT NULL,
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Backfill Shared Identity References ───────────────────────

UPDATE addresses a
SET profile_id = c.profile_id
FROM customers c
WHERE a.customer_id = c.id
  AND a.profile_id IS NULL
  AND c.profile_id IS NOT NULL;

UPDATE wallets w
SET profile_id = c.profile_id
FROM customers c
WHERE w.customer_id = c.id
  AND w.profile_id IS NULL
  AND c.profile_id IS NOT NULL;

UPDATE wallet_txns wt
SET profile_id = w.profile_id
FROM wallets w
WHERE wt.wallet_id = w.id
  AND wt.profile_id IS NULL
  AND w.profile_id IS NOT NULL;

UPDATE orders o
SET profile_id = c.profile_id
FROM customers c
WHERE o.customer_id = c.id
  AND o.profile_id IS NULL
  AND c.profile_id IS NOT NULL;

UPDATE ratings r
SET profile_id = c.profile_id
FROM customers c
WHERE r.customer_id = c.id
  AND r.profile_id IS NULL
  AND c.profile_id IS NOT NULL;

UPDATE carts c1
SET profile_id = c2.profile_id
FROM customers c2
WHERE c1.customer_id = c2.id
  AND c1.profile_id IS NULL
  AND c2.profile_id IS NOT NULL;

UPDATE support_tickets st
SET profile_id = c.profile_id
FROM customers c
WHERE st.customer_id = c.id
  AND st.profile_id IS NULL
  AND c.profile_id IS NOT NULL;

UPDATE customer_sessions cs
SET profile_id = c.profile_id
FROM customers c
WHERE cs.customer_id = c.id
  AND cs.profile_id IS NULL
  AND c.profile_id IS NOT NULL;

UPDATE payment_intents pi
SET profile_id = c.profile_id
FROM customers c
WHERE pi.customer_id = c.id
  AND pi.profile_id IS NULL
  AND c.profile_id IS NOT NULL;

UPDATE otp_challenges oc
SET profile_id = c.profile_id
FROM customers c
WHERE oc.phone = c.phone
  AND oc.profile_id IS NULL
  AND c.profile_id IS NOT NULL;

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_customers_profile_id ON customers(profile_id);
CREATE INDEX IF NOT EXISTS idx_addresses_profile_id ON addresses(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallets_profile_id ON wallets(profile_id);
CREATE INDEX IF NOT EXISTS idx_wallet_txns_profile_id ON wallet_txns(profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_profile_id ON orders(profile_id);
CREATE INDEX IF NOT EXISTS idx_ratings_profile_id ON ratings(profile_id);
CREATE INDEX IF NOT EXISTS idx_carts_profile_id ON carts(profile_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_profile_id ON support_tickets(profile_id);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_profile_id ON customer_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_profile_id ON otp_challenges(profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_profile_id ON payment_intents(profile_id);
CREATE INDEX IF NOT EXISTS idx_order_status_events_created_by_profile_id ON order_status_events(created_by_profile_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_members_profile_id ON restaurant_staff_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_members_restaurant_id ON restaurant_staff_members(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_agent_profile_id ON delivery_assignments(agent_profile_id);
CREATE INDEX IF NOT EXISTS idx_delivery_handoff_tokens_order_id ON delivery_handoff_tokens(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_handoff_tokens_customer_profile_id ON delivery_handoff_tokens(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_delivery_handoff_tokens_delivery_partner_id ON delivery_handoff_tokens(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_delivery_handoff_tokens_status ON delivery_handoff_tokens(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_handoff_tokens_one_active_per_order
  ON delivery_handoff_tokens(order_id)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_admin_actions_order_id ON admin_actions(order_id);

-- ── Helper Functions ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT role FROM public.app_profiles WHERE id = auth.uid()), 'guest');
$$;

CREATE OR REPLACE FUNCTION public.current_customer_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.customers WHERE profile_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_restaurant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT restaurant_id
  FROM public.restaurant_staff_members
  WHERE profile_id = auth.uid()
    AND active = true
  ORDER BY CASE WHEN role = 'restaurant_owner' THEN 0 ELSE 1 END, created_at
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_app_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_restaurant_member(p_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurant_staff_members
    WHERE restaurant_id = p_restaurant_id
      AND profile_id = auth.uid()
      AND active = true
  ) OR public.is_admin_role();
$$;

CREATE OR REPLACE FUNCTION public.is_assigned_agent(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.delivery_assignments
    WHERE order_id = p_order_id
      AND agent_profile_id = auth.uid()
      AND status IN ('assigned', 'picked_up', 'in_transit', 'delivered')
  ) OR public.is_admin_role();
$$;

CREATE OR REPLACE FUNCTION public.can_access_order(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = p_order_id
      AND (
        o.profile_id = auth.uid()
        OR public.is_restaurant_member(o.restaurant_id)
        OR public.is_assigned_agent(o.id)
        OR public.is_admin_role()
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.generate_demo_reference(p_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN p_prefix || '-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 8));
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT CASE
    WHEN p_phone IS NULL OR LENGTH(p_phone) < 4 THEN COALESCE(p_phone, '')
    ELSE SUBSTRING(p_phone FROM 1 FOR 2) || '******' || RIGHT(p_phone, 2)
  END;
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_profile(p_display_name TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_name TEXT := COALESCE(NULLIF(TRIM(p_display_name), ''), 'Guest Customer');
  v_customer_id UUID;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.app_profiles (id, role, name, is_guest, updated_at)
  VALUES (v_auth_user_id, 'guest', v_name, true, NOW())
  ON CONFLICT (id) DO UPDATE
  SET
    name = COALESCE(public.app_profiles.name, EXCLUDED.name),
    updated_at = NOW();

  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE profile_id = v_auth_user_id
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (profile_id, name, is_guest, role, created_at, updated_at)
    VALUES (v_auth_user_id, v_name, true, 'guest', NOW(), NOW())
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET
      name = COALESCE(public.customers.name, v_name),
      is_guest = COALESCE(public.customers.is_guest, true),
      role = COALESCE(public.customers.role, 'guest'),
      updated_at = NOW()
    WHERE id = v_customer_id;
  END IF;

  RETURN jsonb_build_object(
    'profile_id', v_auth_user_id,
    'customer_id', v_customer_id,
    'role', (SELECT role FROM public.app_profiles WHERE id = v_auth_user_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.send_demo_otp(
  p_phone TEXT,
  p_purpose TEXT DEFAULT 'login',
  p_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_phone TEXT := RIGHT(REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g'), 10);
  v_code TEXT := LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF LENGTH(v_phone) <> 10 THEN
    RAISE EXCEPTION 'Enter a valid 10-digit phone number.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.otp_challenges (
    profile_id,
    phone,
    purpose,
    code,
    expires_at,
    metadata,
    created_at
  )
  VALUES (
    v_auth_user_id,
    v_phone,
    CASE WHEN p_purpose IN ('login', 'checkout') THEN p_purpose ELSE 'login' END,
    v_code,
    NOW() + INTERVAL '10 minutes',
    jsonb_build_object('name', COALESCE(NULLIF(TRIM(p_name), ''), 'BiteBlast Customer'), 'demoMode', true),
    NOW()
  );

  RETURN jsonb_build_object(
    'phone', v_phone,
    'masked_phone', public.mask_phone(v_phone),
    'code', v_code
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_demo_otp(
  p_phone TEXT,
  p_code TEXT,
  p_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_phone TEXT := RIGHT(REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g'), 10);
  v_code TEXT := RIGHT(REGEXP_REPLACE(COALESCE(p_code, ''), '\D', '', 'g'), 6);
  v_challenge public.otp_challenges%ROWTYPE;
  v_customer_id UUID;
  v_name TEXT;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_challenge
  FROM public.otp_challenges
  WHERE profile_id = v_auth_user_id
    AND phone = v_phone
    AND consumed_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_challenge.id IS NULL THEN
    RAISE EXCEPTION 'No OTP challenge found for this phone number.' USING ERRCODE = 'P0002';
  END IF;

  IF v_challenge.expires_at < NOW() THEN
    RAISE EXCEPTION 'This OTP has expired. Request a fresh code.' USING ERRCODE = '22023';
  END IF;

  IF v_challenge.code <> v_code THEN
    UPDATE public.otp_challenges
    SET attempts = COALESCE(attempts, 0) + 1
    WHERE id = v_challenge.id;

    RAISE EXCEPTION 'That OTP is incorrect.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.otp_challenges
  SET
    consumed_at = NOW(),
    attempts = COALESCE(attempts, 0) + 1
  WHERE id = v_challenge.id;

  v_name := COALESCE(NULLIF(TRIM(p_name), ''), NULLIF(TRIM(v_challenge.metadata ->> 'name'), ''), 'BiteBlast Customer');

  INSERT INTO public.app_profiles (
    id,
    role,
    phone,
    name,
    is_guest,
    verified_at,
    last_login_at,
    updated_at
  )
  VALUES (
    v_auth_user_id,
    'customer',
    v_phone,
    v_name,
    false,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = 'customer',
    phone = EXCLUDED.phone,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.app_profiles.name),
    is_guest = false,
    verified_at = COALESCE(public.app_profiles.verified_at, NOW()),
    last_login_at = NOW(),
    updated_at = NOW();

  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE profile_id = v_auth_user_id
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (
      profile_id,
      phone,
      name,
      is_guest,
      role,
      verified_at,
      last_login_at,
      created_at,
      updated_at
    )
    VALUES (
      v_auth_user_id,
      v_phone,
      v_name,
      false,
      'customer',
      NOW(),
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_customer_id;
  ELSE
    UPDATE public.customers
    SET
      phone = v_phone,
      name = COALESCE(NULLIF(v_name, ''), public.customers.name),
      is_guest = false,
      role = 'customer',
      verified_at = COALESCE(public.customers.verified_at, NOW()),
      last_login_at = NOW(),
      updated_at = NOW()
    WHERE id = v_customer_id;
  END IF;

  UPDATE public.carts SET profile_id = v_auth_user_id WHERE customer_id = v_customer_id AND profile_id IS NULL;
  UPDATE public.orders SET profile_id = v_auth_user_id WHERE customer_id = v_customer_id AND profile_id IS NULL;
  UPDATE public.addresses SET profile_id = v_auth_user_id WHERE customer_id = v_customer_id AND profile_id IS NULL;
  UPDATE public.support_tickets SET profile_id = v_auth_user_id WHERE customer_id = v_customer_id AND profile_id IS NULL;
  UPDATE public.payment_intents SET profile_id = v_auth_user_id WHERE customer_id = v_customer_id AND profile_id IS NULL;
  UPDATE public.wallets SET profile_id = v_auth_user_id WHERE customer_id = v_customer_id AND profile_id IS NULL;
  UPDATE public.ratings SET profile_id = v_auth_user_id WHERE customer_id = v_customer_id AND profile_id IS NULL;

  RETURN jsonb_build_object(
    'customer_id', v_customer_id,
    'profile_id', v_auth_user_id,
    'role', 'customer',
    'message', 'Your verified customer identity is now active.'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.save_customer_address(
  p_label TEXT,
  p_line1 TEXT,
  p_area TEXT,
  p_city TEXT,
  p_landmark TEXT,
  p_instructions TEXT DEFAULT NULL,
  p_contact_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_is_default BOOLEAN DEFAULT FALSE
)
RETURNS public.addresses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_customer_id UUID := public.current_customer_id();
  v_address public.addresses;
BEGIN
  IF v_auth_user_id IS NULL OR v_customer_id IS NULL OR public.current_app_role() <> 'customer' THEN
    RAISE EXCEPTION 'Verified customer access is required.' USING ERRCODE = '42501';
  END IF;

  IF COALESCE(TRIM(p_line1), '') = '' OR COALESCE(TRIM(p_area), '') = '' OR COALESCE(TRIM(p_landmark), '') = '' THEN
    RAISE EXCEPTION 'Street, area, and landmark are required.' USING ERRCODE = '22023';
  END IF;

  IF p_is_default THEN
    UPDATE public.addresses
    SET is_default = false, updated_at = NOW()
    WHERE customer_id = v_customer_id;
  END IF;

  INSERT INTO public.addresses (
    customer_id,
    profile_id,
    label,
    building,
    street,
    area,
    city,
    contact_name,
    phone,
    instructions,
    is_default,
    updated_at,
    created_at
  )
  VALUES (
    v_customer_id,
    v_auth_user_id,
    COALESCE(NULLIF(TRIM(p_label), ''), 'Home'),
    TRIM(p_line1),
    TRIM(p_landmark),
    TRIM(p_area),
    COALESCE(NULLIF(TRIM(p_city), ''), 'Pune'),
    NULLIF(TRIM(p_contact_name), ''),
    NULLIF(TRIM(p_phone), ''),
    NULLIF(TRIM(p_instructions), ''),
    COALESCE(p_is_default, false),
    NOW(),
    NOW()
  )
  RETURNING * INTO v_address;

  RETURN v_address;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_default_customer_address(p_address_id UUID)
RETURNS public.addresses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID := public.current_customer_id();
  v_address public.addresses;
BEGIN
  IF v_customer_id IS NULL OR public.current_app_role() <> 'customer' THEN
    RAISE EXCEPTION 'Verified customer access is required.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.addresses
  SET is_default = false, updated_at = NOW()
  WHERE customer_id = v_customer_id;

  UPDATE public.addresses
  SET is_default = true, updated_at = NOW()
  WHERE id = p_address_id
    AND customer_id = v_customer_id
  RETURNING * INTO v_address;

  IF v_address.id IS NULL THEN
    RAISE EXCEPTION 'Address not found.' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_address;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_cart_snapshot()
RETURNS TABLE (
  cart_id UUID,
  customer_id UUID,
  profile_id UUID,
  restaurant_id UUID,
  restaurant_name TEXT,
  items JSONB,
  subtotal NUMERIC,
  delivery_fee NUMERIC,
  platform_fee NUMERIC,
  discount NUMERIC,
  total NUMERIC,
  promo_code TEXT,
  discount_rate NUMERIC
)
LANGUAGE sql
STABLE
AS $$
  WITH cart_base AS (
    SELECT
      c.id,
      c.customer_id,
      c.profile_id,
      c.restaurant_id,
      r.name AS restaurant_name,
      COALESCE(c.promo_code, '') AS promo_code,
      COALESCE(c.discount_rate, 0) AS discount_rate
    FROM public.carts c
    JOIN public.restaurants r ON r.id = c.restaurant_id
    WHERE c.profile_id = auth.uid()
    LIMIT 1
  ),
  item_rows AS (
    SELECT
      cb.id AS cart_id,
      cb.customer_id,
      cb.profile_id,
      cb.restaurant_id,
      cb.restaurant_name,
      cb.promo_code,
      cb.discount_rate,
      ci.id AS cart_item_id,
      mi.id AS menu_item_id,
      mi.name,
      ci.quantity,
      mi.price,
      mi.image_url,
      mi.is_available
    FROM cart_base cb
    LEFT JOIN public.cart_items ci ON ci.cart_id = cb.id
    LEFT JOIN public.menu_items mi ON mi.id = ci.menu_item_id
  )
  SELECT
    cart_id,
    customer_id,
    profile_id,
    restaurant_id,
    restaurant_name,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', menu_item_id,
          'name', name,
          'quantity', quantity,
          'price', price,
          'image', image_url,
          'restaurantId', restaurant_id,
          'restaurantName', restaurant_name,
          'isAvailable', COALESCE(is_available, true)
        )
      ) FILTER (WHERE menu_item_id IS NOT NULL),
      '[]'::jsonb
    ) AS items,
    COALESCE(SUM(price * quantity), 0)::NUMERIC AS subtotal,
    CASE WHEN COALESCE(SUM(price * quantity), 0) > 0 THEN 4.99 ELSE 0 END::NUMERIC AS delivery_fee,
    CASE WHEN COALESCE(SUM(price * quantity), 0) > 0 THEN 2.50 ELSE 0 END::NUMERIC AS platform_fee,
    ROUND(COALESCE(SUM(price * quantity), 0) * MAX(discount_rate), 2)::NUMERIC AS discount,
    GREATEST(
      0,
      COALESCE(SUM(price * quantity), 0)
      + CASE WHEN COALESCE(SUM(price * quantity), 0) > 0 THEN 4.99 ELSE 0 END
      + CASE WHEN COALESCE(SUM(price * quantity), 0) > 0 THEN 2.50 ELSE 0 END
      - ROUND(COALESCE(SUM(price * quantity), 0) * MAX(discount_rate), 2)
    )::NUMERIC AS total,
    MAX(promo_code) AS promo_code,
    MAX(discount_rate)::NUMERIC AS discount_rate
  FROM item_rows
  GROUP BY cart_id, customer_id, profile_id, restaurant_id, restaurant_name;
$$;

CREATE OR REPLACE FUNCTION public.add_cart_item(
  p_menu_item_id UUID,
  p_quantity INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_customer_id UUID := public.current_customer_id();
  v_menu public.menu_items%ROWTYPE;
  v_cart public.carts%ROWTYPE;
BEGIN
  IF v_auth_user_id IS NULL OR v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer session is not ready yet.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_menu
  FROM public.menu_items
  WHERE id = p_menu_item_id;

  IF v_menu.id IS NULL OR COALESCE(v_menu.is_available, true) = false THEN
    RAISE EXCEPTION 'This item is unavailable right now.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_cart
  FROM public.carts
  WHERE profile_id = v_auth_user_id
  LIMIT 1;

  IF v_cart.id IS NULL THEN
    INSERT INTO public.carts (
      customer_id,
      profile_id,
      restaurant_id,
      promo_code,
      discount_rate,
      created_at,
      updated_at
    )
    VALUES (
      v_customer_id,
      v_auth_user_id,
      v_menu.restaurant_id,
      NULL,
      0,
      NOW(),
      NOW()
    )
    RETURNING * INTO v_cart;
  ELSIF v_cart.restaurant_id <> v_menu.restaurant_id THEN
    DELETE FROM public.cart_items WHERE cart_id = v_cart.id;
    UPDATE public.carts
    SET
      restaurant_id = v_menu.restaurant_id,
      promo_code = NULL,
      discount_rate = 0,
      updated_at = NOW()
    WHERE id = v_cart.id
    RETURNING * INTO v_cart;
  END IF;

  INSERT INTO public.cart_items (
    cart_id,
    menu_item_id,
    quantity,
    created_at,
    updated_at
  )
  VALUES (
    v_cart.id,
    p_menu_item_id,
    GREATEST(COALESCE(p_quantity, 1), 1),
    NOW(),
    NOW()
  )
  ON CONFLICT (cart_id, menu_item_id) DO UPDATE
  SET
    quantity = public.cart_items.quantity + GREATEST(COALESCE(p_quantity, 1), 1),
    updated_at = NOW();

  UPDATE public.carts
  SET updated_at = NOW(), customer_id = v_customer_id, profile_id = v_auth_user_id
  WHERE id = v_cart.id;

  RETURN jsonb_build_object('cart_id', v_cart.id);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_cart_item_quantity(
  p_cart_item_id UUID,
  p_quantity INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id UUID;
BEGIN
  SELECT ci.cart_id INTO v_cart_id
  FROM public.cart_items ci
  JOIN public.carts c ON c.id = ci.cart_id
  WHERE ci.id = p_cart_item_id
    AND c.profile_id = auth.uid();

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'Cart item not found.' USING ERRCODE = 'P0002';
  END IF;

  IF COALESCE(p_quantity, 0) <= 0 THEN
    DELETE FROM public.cart_items WHERE id = p_cart_item_id;
  ELSE
    UPDATE public.cart_items
    SET quantity = p_quantity, updated_at = NOW()
    WHERE id = p_cart_item_id;
  END IF;

  UPDATE public.carts SET updated_at = NOW() WHERE id = v_cart_id;
  RETURN jsonb_build_object('cart_id', v_cart_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_cart_item(p_cart_item_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id UUID;
BEGIN
  SELECT ci.cart_id INTO v_cart_id
  FROM public.cart_items ci
  JOIN public.carts c ON c.id = ci.cart_id
  WHERE ci.id = p_cart_item_id
    AND c.profile_id = auth.uid();

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'Cart item not found.' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.cart_items WHERE id = p_cart_item_id;
  UPDATE public.carts SET updated_at = NOW() WHERE id = v_cart_id;
  RETURN jsonb_build_object('cart_id', v_cart_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_cart_promo(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart public.carts%ROWTYPE;
  v_promo public.promo_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_cart FROM public.carts WHERE profile_id = auth.uid() LIMIT 1;
  IF v_cart.id IS NULL THEN
    RAISE EXCEPTION 'No active cart found.' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE code = UPPER(TRIM(COALESCE(p_code, '')))
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF v_promo.id IS NULL THEN
    RAISE EXCEPTION 'Promo code is invalid or expired.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.carts
  SET
    promo_code = v_promo.code,
    discount_rate = v_promo.discount_rate,
    updated_at = NOW()
  WHERE id = v_cart.id;

  RETURN jsonb_build_object(
    'cart_id', v_cart.id,
    'promo_code', v_promo.code,
    'discount_rate', v_promo.discount_rate
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_current_cart()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_id UUID;
BEGIN
  SELECT id INTO v_cart_id FROM public.carts WHERE profile_id = auth.uid() LIMIT 1;
  IF v_cart_id IS NULL THEN
    RETURN jsonb_build_object('cleared', false);
  END IF;

  DELETE FROM public.cart_items WHERE cart_id = v_cart_id;
  UPDATE public.carts
  SET promo_code = NULL, discount_rate = 0, updated_at = NOW()
  WHERE id = v_cart_id;

  RETURN jsonb_build_object('cleared', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.create_order_row(
  p_payment_method TEXT,
  p_payment_status TEXT,
  p_checkout JSONB
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot RECORD;
  v_order public.orders;
  v_item JSONB;
BEGIN
  SELECT * INTO v_snapshot FROM public.current_cart_snapshot();

  IF v_snapshot.cart_id IS NULL OR jsonb_array_length(v_snapshot.items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_snapshot.items) AS item
    WHERE COALESCE((item ->> 'isAvailable')::BOOLEAN, true) = false
  ) THEN
    RAISE EXCEPTION 'One or more items became unavailable.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.orders (
    customer_id,
    profile_id,
    restaurant_id,
    status,
    items,
    subtotal,
    delivery_fee,
    platform_fee,
    gst,
    discount,
    total,
    payment_method,
    payment_status,
    delivery_address,
    eta_minutes,
    created_at,
    updated_at
  )
  VALUES (
    v_snapshot.customer_id,
    v_snapshot.profile_id,
    v_snapshot.restaurant_id,
    'pending',
    v_snapshot.items,
    ROUND(v_snapshot.subtotal::NUMERIC, 2),
    ROUND(v_snapshot.delivery_fee::NUMERIC, 2),
    ROUND(v_snapshot.platform_fee::NUMERIC, 2),
    0,
    ROUND(v_snapshot.discount::NUMERIC, 2),
    ROUND(v_snapshot.total::NUMERIC, 2),
    p_payment_method,
    p_payment_status,
    jsonb_build_object(
      'label', COALESCE(p_checkout ->> 'addressLabel', 'Home'),
      'line1', COALESCE(p_checkout ->> 'addressLine1', ''),
      'area', COALESCE(p_checkout ->> 'area', ''),
      'city', COALESCE(p_checkout ->> 'city', 'Pune'),
      'landmark', COALESCE(p_checkout ->> 'landmark', ''),
      'instructions', COALESCE(p_checkout ->> 'instructions', ''),
      'name', COALESCE(p_checkout ->> 'name', ''),
      'phone', COALESCE(p_checkout ->> 'phone', '')
    ),
    28,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_order;

  FOR v_item IN
    SELECT * FROM jsonb_array_elements(v_snapshot.items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      restaurant_id,
      name,
      quantity,
      unit_price,
      line_total,
      image_url,
      created_at
    )
    VALUES (
      v_order.id,
      NULLIF(v_item ->> 'id', '')::UUID,
      v_snapshot.restaurant_id,
      v_item ->> 'name',
      COALESCE((v_item ->> 'quantity')::INT, 1),
      COALESCE((v_item ->> 'price')::NUMERIC, 0),
      COALESCE((v_item ->> 'price')::NUMERIC, 0) * COALESCE((v_item ->> 'quantity')::INT, 1),
      v_item ->> 'image',
      NOW()
    );
  END LOOP;

  INSERT INTO public.order_status_events (
    order_id,
    status,
    title,
    detail,
    created_by_role,
    created_by_profile_id,
    source,
    created_at
  )
  VALUES (
    v_order.id,
    'pending',
    'Order placed',
    'Your order is waiting for restaurant confirmation.',
    public.current_app_role(),
    auth.uid(),
    'checkout',
    NOW()
  );

  PERFORM public.clear_current_cart();
  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_demo_payment_intent(
  p_payment_method TEXT,
  p_checkout JSONB
)
RETURNS public.payment_intents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID := public.current_customer_id();
  v_snapshot RECORD;
  v_intent public.payment_intents;
BEGIN
  IF auth.uid() IS NULL OR v_customer_id IS NULL OR public.current_app_role() <> 'customer' THEN
    RAISE EXCEPTION 'Verified customer access is required.' USING ERRCODE = '42501';
  END IF;

  IF p_payment_method NOT IN ('upi', 'card', 'wallet') THEN
    RAISE EXCEPTION 'Unsupported payment method.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_snapshot FROM public.current_cart_snapshot();
  IF v_snapshot.cart_id IS NULL OR jsonb_array_length(v_snapshot.items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.payment_intents (
    customer_id,
    profile_id,
    amount,
    currency,
    method,
    provider,
    status,
    reference,
    checkout_payload,
    created_at,
    updated_at
  )
  VALUES (
    v_customer_id,
    auth.uid(),
    ROUND(v_snapshot.total::NUMERIC, 2),
    'INR',
    p_payment_method,
    'biteblast_demo',
    'created',
    public.generate_demo_reference('BBPAY'),
    jsonb_build_object(
      'items', v_snapshot.items,
      'summary', jsonb_build_object(
        'subtotal', ROUND(v_snapshot.subtotal::NUMERIC, 2),
        'delivery', ROUND(v_snapshot.delivery_fee::NUMERIC, 2),
        'service', ROUND(v_snapshot.platform_fee::NUMERIC, 2),
        'discount', ROUND(v_snapshot.discount::NUMERIC, 2),
        'total', ROUND(v_snapshot.total::NUMERIC, 2)
      ),
      'checkout', p_checkout
    ),
    NOW(),
    NOW()
  )
  RETURNING * INTO v_intent;

  RETURN v_intent;
END;
$$;

CREATE OR REPLACE FUNCTION public.place_cod_order(p_checkout JSONB)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.current_customer_id() IS NULL OR public.current_app_role() <> 'customer' THEN
    RAISE EXCEPTION 'Verified customer access is required.' USING ERRCODE = '42501';
  END IF;

  RETURN public.create_order_row('cod', 'pending', p_checkout);
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_demo_payment_intent(
  p_intent_id UUID,
  p_outcome TEXT,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_intent public.payment_intents%ROWTYPE;
  v_order public.orders;
BEGIN
  SELECT * INTO v_intent
  FROM public.payment_intents
  WHERE id = p_intent_id
    AND profile_id = auth.uid();

  IF v_intent.id IS NULL THEN
    RAISE EXCEPTION 'Payment intent not found.' USING ERRCODE = 'P0002';
  END IF;

  IF p_outcome = 'failed' THEN
    UPDATE public.payment_intents
    SET
      status = 'failed',
      failure_reason = COALESCE(NULLIF(TRIM(p_failure_reason), ''), 'Payment was declined in demo mode.'),
      updated_at = NOW()
    WHERE id = v_intent.id;

    RETURN jsonb_build_object(
      'intent_id', v_intent.id,
      'status', 'failed',
      'order_id', NULL
    );
  END IF;

  IF v_intent.order_id IS NULL THEN
    v_order := public.create_order_row(v_intent.method, 'paid', v_intent.checkout_payload -> 'checkout');
  ELSE
    SELECT * INTO v_order FROM public.orders WHERE id = v_intent.order_id;
  END IF;

  UPDATE public.payment_intents
  SET
    order_id = v_order.id,
    status = 'succeeded',
    failure_reason = NULL,
    updated_at = NOW()
  WHERE id = v_intent.id;

  RETURN jsonb_build_object(
    'intent_id', v_intent.id,
    'status', 'succeeded',
    'order_id', v_order.id
  );
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
  v_payment_status TEXT;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND profile_id = auth.uid();

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status NOT IN ('pending', 'confirmed', 'preparing', 'ready_for_pickup') THEN
    RAISE EXCEPTION 'This order can no longer be cancelled.' USING ERRCODE = '22023';
  END IF;

  v_payment_status := CASE WHEN v_order.payment_status = 'paid' THEN 'refunded' ELSE v_order.payment_status END;

  UPDATE public.orders
  SET
    status = 'cancelled',
    payment_status = v_payment_status,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  INSERT INTO public.order_status_events (
    order_id,
    status,
    title,
    detail,
    created_by_role,
    created_by_profile_id,
    source,
    reason_code,
    created_at
  )
  VALUES (
    p_order_id,
    'cancelled',
    'Order cancelled',
    CASE WHEN v_payment_status = 'refunded' THEN 'Your demo payment has been marked for refund.' ELSE 'The order was cancelled before dispatch.' END,
    public.current_app_role(),
    auth.uid(),
    'customer_cancel',
    'customer_requested',
    NOW()
  );

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_customer_rating(
  p_order_id UUID,
  p_score INT,
  p_review TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS public.ratings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID := public.current_customer_id();
  v_order public.orders%ROWTYPE;
  v_rating public.ratings;
BEGIN
  IF v_customer_id IS NULL OR public.current_app_role() <> 'customer' THEN
    RAISE EXCEPTION 'Verified customer access is required.' USING ERRCODE = '42501';
  END IF;

  IF p_score < 1 OR p_score > 5 THEN
    RAISE EXCEPTION 'Ratings must be between 1 and 5.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND profile_id = auth.uid();

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_order.status <> 'delivered' THEN
    RAISE EXCEPTION 'Ratings unlock after delivery.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.ratings (
    order_id,
    customer_id,
    profile_id,
    score,
    tags,
    review,
    created_at
  )
  VALUES (
    p_order_id,
    v_customer_id,
    auth.uid(),
    p_score,
    COALESCE(p_tags, ARRAY[]::TEXT[]),
    NULLIF(TRIM(p_review), ''),
    NOW()
  )
  ON CONFLICT (order_id) DO UPDATE
  SET
    score = EXCLUDED.score,
    tags = EXCLUDED.tags,
    review = EXCLUDED.review
  RETURNING * INTO v_rating;

  RETURN v_rating;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_support_ticket(
  p_order_id UUID,
  p_issue_type TEXT,
  p_message TEXT
)
RETURNS public.support_tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id UUID := public.current_customer_id();
  v_order public.orders%ROWTYPE;
  v_ticket public.support_tickets;
BEGIN
  IF v_customer_id IS NULL OR public.current_app_role() <> 'customer' THEN
    RAISE EXCEPTION 'Verified customer access is required.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND profile_id = auth.uid();

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found.' USING ERRCODE = 'P0002';
  END IF;

  IF p_issue_type NOT IN ('late_delivery', 'missing_items', 'payment_issue', 'food_quality', 'other') THEN
    RAISE EXCEPTION 'Unsupported issue type.' USING ERRCODE = '22023';
  END IF;

  IF COALESCE(TRIM(p_message), '') = '' THEN
    RAISE EXCEPTION 'A support message is required.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.support_tickets (
    customer_id,
    profile_id,
    order_id,
    issue_type,
    message,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_customer_id,
    auth.uid(),
    p_order_id,
    p_issue_type,
    TRIM(p_message),
    'open',
    NOW(),
    NOW()
  )
  RETURNING * INTO v_ticket;

  RETURN v_ticket;
END;
$$;

CREATE OR REPLACE FUNCTION public.bootstrap_demo_restaurant_access(
  p_restaurant_id UUID,
  p_access_role TEXT DEFAULT 'restaurant_owner',
  p_display_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_role TEXT := CASE
    WHEN p_access_role IN ('restaurant_owner', 'restaurant_staff') THEN p_access_role
    ELSE 'restaurant_owner'
  END;
  v_restaurant public.restaurants%ROWTYPE;
  v_name TEXT;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_restaurant
  FROM public.restaurants
  WHERE id = p_restaurant_id
    AND is_active = true;

  IF v_restaurant.id IS NULL THEN
    RAISE EXCEPTION 'Restaurant not found.' USING ERRCODE = 'P0002';
  END IF;

  v_name := COALESCE(
    NULLIF(TRIM(p_display_name), ''),
    NULLIF(TRIM(v_restaurant.owner_name), ''),
    v_restaurant.name || ' Operator'
  );

  INSERT INTO public.app_profiles (
    id,
    role,
    name,
    is_guest,
    verified_at,
    last_login_at,
    updated_at
  )
  VALUES (
    v_auth_user_id,
    v_role,
    v_name,
    false,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = v_role,
    name = COALESCE(NULLIF(public.app_profiles.name, ''), EXCLUDED.name),
    is_guest = false,
    verified_at = COALESCE(public.app_profiles.verified_at, NOW()),
    last_login_at = NOW(),
    updated_at = NOW();

  INSERT INTO public.restaurant_staff_members (
    restaurant_id,
    profile_id,
    role,
    active,
    created_at
  )
  VALUES (
    v_restaurant.id,
    v_auth_user_id,
    v_role,
    true,
    NOW()
  )
  ON CONFLICT (restaurant_id, profile_id) DO UPDATE
  SET
    role = EXCLUDED.role,
    active = true;

  IF v_role = 'restaurant_owner' THEN
    UPDATE public.restaurants
    SET owner_profile_id = v_auth_user_id
    WHERE id = v_restaurant.id
      AND (owner_profile_id IS NULL OR owner_profile_id = v_auth_user_id);
  END IF;

  RETURN jsonb_build_object(
    'profile_id', v_auth_user_id,
    'restaurant_id', v_restaurant.id,
    'restaurant_name', v_restaurant.name,
    'role', v_role
  );
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
  v_next_status TEXT;
  v_title TEXT;
  v_detail TEXT;
  v_payment_status TEXT;
BEGIN
  IF auth.uid() IS NULL OR public.current_app_role() NOT IN ('restaurant_owner', 'restaurant_staff', 'admin') THEN
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

  v_next_status := CASE
    WHEN p_target_status IN ('confirmed', 'preparing', 'ready_for_pickup', 'cancelled') THEN p_target_status
    ELSE NULL
  END;

  IF v_next_status IS NULL THEN
    RAISE EXCEPTION 'Unsupported restaurant status transition.' USING ERRCODE = '22023';
  END IF;

  IF v_order.status = v_next_status THEN
    RETURN v_order;
  END IF;

  IF v_order.status = 'pending' AND v_next_status = 'confirmed' THEN
    v_title := 'Order accepted';
    v_detail := COALESCE(NULLIF(TRIM(p_detail), ''), 'The restaurant has accepted your order.');
  ELSIF v_order.status IN ('pending', 'confirmed') AND v_next_status = 'cancelled' THEN
    v_title := 'Order rejected';
    v_detail := COALESCE(NULLIF(TRIM(p_detail), ''), 'The restaurant could not fulfill this order.');
  ELSIF v_order.status = 'confirmed' AND v_next_status = 'preparing' THEN
    v_title := 'Kitchen is preparing';
    v_detail := COALESCE(NULLIF(TRIM(p_detail), ''), 'The kitchen has started preparing your order.');
  ELSIF v_order.status = 'preparing' AND v_next_status = 'ready_for_pickup' THEN
    v_title := 'Packed and ready';
    v_detail := COALESCE(NULLIF(TRIM(p_detail), ''), 'The order is packed and ready for rider handoff.');
  ELSE
    RAISE EXCEPTION 'That transition is not allowed from the current order state.' USING ERRCODE = '22023';
  END IF;

  v_payment_status := CASE
    WHEN v_next_status = 'cancelled' AND v_order.payment_status = 'paid' THEN 'refunded'
    ELSE v_order.payment_status
  END;

  UPDATE public.orders
  SET
    status = v_next_status,
    payment_status = v_payment_status,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  INSERT INTO public.order_status_events (
    order_id,
    status,
    title,
    detail,
    created_by_role,
    created_by_profile_id,
    source,
    reason_code,
    created_at
  )
  VALUES (
    p_order_id,
    v_next_status,
    v_title,
    v_detail,
    public.current_app_role(),
    auth.uid(),
    'restaurant_ops',
    p_reason_code,
    NOW()
  );

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_customer_order_lifecycle()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_elapsed_minutes NUMERIC;
  v_next_status TEXT;
  v_title TEXT;
  v_detail TEXT;
  v_current_rank INT;
  v_next_rank INT;
BEGIN
  FOR v_order IN
    SELECT id, status, created_at
    FROM public.orders
    WHERE profile_id = auth.uid()
      AND status NOT IN ('delivered', 'cancelled', 'refunded')
  LOOP
    v_elapsed_minutes := GREATEST(0, EXTRACT(EPOCH FROM (NOW() - v_order.created_at)) / 60);
    v_next_status := v_order.status;
    v_title := NULL;
    v_detail := NULL;

    IF v_elapsed_minutes >= 38 THEN
      v_next_status := 'delivered';
      v_title := 'Delivered';
      v_detail := 'Your order reached the delivery address.';
    ELSIF v_elapsed_minutes >= 28 THEN
      v_next_status := 'in_transit';
      v_title := 'Out for delivery';
      v_detail := 'The rider is on the way to you.';
    ELSIF v_elapsed_minutes >= 18 THEN
      v_next_status := 'picked_up';
      v_title := 'Picked up';
      v_detail := 'Your order has left the restaurant.';
    ELSIF v_elapsed_minutes >= 14 THEN
      v_next_status := 'ready_for_pickup';
      v_title := 'Packed and ready';
      v_detail := 'The order is packed for rider handoff.';
    ELSIF v_elapsed_minutes >= 8 THEN
      v_next_status := 'preparing';
      v_title := 'Kitchen is preparing';
      v_detail := 'Your dishes are being cooked now.';
    ELSIF v_elapsed_minutes >= 4 THEN
      v_next_status := 'confirmed';
      v_title := 'Order accepted';
      v_detail := 'The restaurant has received your order.';
    ELSE
      v_next_status := 'pending';
      v_title := 'Order placed';
      v_detail := 'Waiting for restaurant confirmation.';
    END IF;

    v_current_rank := CASE v_order.status
      WHEN 'pending' THEN 0
      WHEN 'confirmed' THEN 1
      WHEN 'preparing' THEN 2
      WHEN 'ready_for_pickup' THEN 3
      WHEN 'agent_assigned' THEN 4
      WHEN 'picked_up' THEN 5
      WHEN 'in_transit' THEN 6
      WHEN 'delivered' THEN 7
      ELSE 0
    END;

    v_next_rank := CASE v_next_status
      WHEN 'pending' THEN 0
      WHEN 'confirmed' THEN 1
      WHEN 'preparing' THEN 2
      WHEN 'ready_for_pickup' THEN 3
      WHEN 'agent_assigned' THEN 4
      WHEN 'picked_up' THEN 5
      WHEN 'in_transit' THEN 6
      WHEN 'delivered' THEN 7
      ELSE 0
    END;

    IF v_next_status <> v_order.status AND v_next_rank > v_current_rank THEN
      UPDATE public.orders
      SET status = v_next_status, updated_at = NOW()
      WHERE id = v_order.id;

      INSERT INTO public.order_status_events (
        order_id,
        status,
        title,
        detail,
        created_by_role,
        created_by_profile_id,
        source,
        created_at
      )
      VALUES (
        v_order.id,
        v_next_status,
        v_title,
        v_detail,
        'system',
        NULL,
        'lifecycle_sync',
        NOW()
      );
    END IF;
  END LOOP;
END;
$$;

-- ── Mission 1: Event Ledger Hardening ─────────────────────────

CREATE SCHEMA IF NOT EXISTS private;

ALTER TABLE public.order_status_events
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'order.status_changed',
  ADD COLUMN IF NOT EXISTS previous_status TEXT,
  ADD COLUMN IF NOT EXISTS actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_role TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION private.prevent_order_status_event_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'order_status_events is append-only.' USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_events_append_only ON public.order_status_events;

CREATE TRIGGER trg_order_status_events_append_only
  BEFORE UPDATE OR DELETE ON public.order_status_events
  FOR EACH ROW
  EXECUTE FUNCTION private.prevent_order_status_event_mutation();

CREATE OR REPLACE FUNCTION private.append_order_event(
  p_order_id UUID,
  p_status TEXT,
  p_event_type TEXT DEFAULT 'order.status_changed',
  p_previous_status TEXT DEFAULT NULL,
  p_title TEXT DEFAULT NULL,
  p_detail TEXT DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'system',
  p_reason_code TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS public.order_status_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_event public.order_status_events%ROWTYPE;
BEGIN
  INSERT INTO public.order_status_events (
    order_id,
    status,
    title,
    detail,
    created_by_role,
    created_by_profile_id,
    source,
    reason_code,
    event_type,
    previous_status,
    actor_id,
    actor_role,
    metadata,
    created_at
  )
  VALUES (
    p_order_id,
    p_status,
    p_title,
    p_detail,
    p_actor_role,
    p_actor_id,
    p_source,
    p_reason_code,
    COALESCE(NULLIF(TRIM(p_event_type), ''), 'order.status_changed'),
    p_previous_status,
    p_actor_id,
    p_actor_role,
    COALESCE(p_metadata, '{}'::jsonb),
    NOW()
  )
  RETURNING * INTO v_event;

  RETURN v_event;
END;
$$;

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
    extensions.digest(
      RIGHT(REGEXP_REPLACE(COALESCE(p_token, ''), '\D', '', 'g'), 6),
      'sha256'
    ),
    'hex'
  );
$$;

CREATE OR REPLACE FUNCTION public.create_order_row(
  p_payment_method TEXT,
  p_payment_status TEXT,
  p_checkout JSONB
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot RECORD;
  v_order public.orders;
  v_item JSONB;
BEGIN
  SELECT * INTO v_snapshot FROM public.current_cart_snapshot();

  IF v_snapshot.cart_id IS NULL OR jsonb_array_length(v_snapshot.items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_snapshot.items) AS item
    WHERE COALESCE((item ->> 'isAvailable')::BOOLEAN, true) = false
  ) THEN
    RAISE EXCEPTION 'One or more items became unavailable.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.orders (
    customer_id,
    profile_id,
    restaurant_id,
    status,
    items,
    subtotal,
    delivery_fee,
    platform_fee,
    gst,
    discount,
    total,
    payment_method,
    payment_status,
    delivery_address,
    eta_minutes,
    created_at,
    updated_at
  )
  VALUES (
    v_snapshot.customer_id,
    v_snapshot.profile_id,
    v_snapshot.restaurant_id,
    'pending',
    v_snapshot.items,
    ROUND(v_snapshot.subtotal::NUMERIC, 2),
    ROUND(v_snapshot.delivery_fee::NUMERIC, 2),
    ROUND(v_snapshot.platform_fee::NUMERIC, 2),
    0,
    ROUND(v_snapshot.discount::NUMERIC, 2),
    ROUND(v_snapshot.total::NUMERIC, 2),
    p_payment_method,
    p_payment_status,
    jsonb_build_object(
      'label', COALESCE(p_checkout ->> 'addressLabel', 'Home'),
      'line1', COALESCE(p_checkout ->> 'addressLine1', ''),
      'area', COALESCE(p_checkout ->> 'area', ''),
      'city', COALESCE(p_checkout ->> 'city', 'Pune'),
      'landmark', COALESCE(p_checkout ->> 'landmark', ''),
      'instructions', COALESCE(p_checkout ->> 'instructions', ''),
      'name', COALESCE(p_checkout ->> 'name', ''),
      'phone', COALESCE(p_checkout ->> 'phone', '')
    ),
    28,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_order;

  FOR v_item IN
    SELECT * FROM jsonb_array_elements(v_snapshot.items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      menu_item_id,
      restaurant_id,
      name,
      quantity,
      unit_price,
      line_total,
      image_url,
      created_at
    )
    VALUES (
      v_order.id,
      NULLIF(v_item ->> 'id', '')::UUID,
      v_snapshot.restaurant_id,
      v_item ->> 'name',
      COALESCE((v_item ->> 'quantity')::INT, 1),
      COALESCE((v_item ->> 'price')::NUMERIC, 0),
      COALESCE((v_item ->> 'price')::NUMERIC, 0) * COALESCE((v_item ->> 'quantity')::INT, 1),
      v_item ->> 'image',
      NOW()
    );
  END LOOP;

  PERFORM private.append_order_event(
    p_order_id => v_order.id,
    p_status => 'pending',
    p_event_type => 'order.placed',
    p_previous_status => NULL,
    p_title => 'Order placed',
    p_detail => 'Your order is waiting for restaurant confirmation.',
    p_actor_id => auth.uid(),
    p_actor_role => public.current_app_role(),
    p_source => 'checkout',
    p_metadata => jsonb_build_object(
      'payment_method', p_payment_method,
      'payment_status', p_payment_status,
      'item_count', COALESCE(jsonb_array_length(v_snapshot.items), 0),
      'order_total', ROUND(v_snapshot.total::NUMERIC, 2)
    )
  );

  PERFORM public.clear_current_cart();
  RETURN v_order;
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
RETURNS JSONB
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
  v_attempt_count INT := 0;
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
    PERFORM private.append_order_event(
      p_order_id => p_order_id,
      p_status => 'picked_up',
      p_event_type => 'delivery.token_verification_failed',
      p_previous_status => 'picked_up',
      p_title => 'Delivery code missing',
      p_detail => 'No active delivery handoff code exists for this order.',
      p_actor_id => auth.uid(),
      p_actor_role => v_actor_role,
      p_source => 'delivery_handoff',
      p_reason_code => 'missing',
      p_metadata => jsonb_build_object(
        'attempt_count', 0
      )
    );

    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'missing',
      'message', 'No delivery handoff code is active for this order.',
      'order_id', p_order_id,
      'status', 'picked_up',
      'attempt_count', 0
    );
  END IF;

  v_submitted_hash := private.hash_delivery_handoff_token(p_token);

  IF v_token_row.status <> 'active' THEN
    v_reason := CASE
      WHEN v_token_row.status = 'expired' THEN 'expired'
      WHEN v_token_row.status = 'used' THEN 'used'
      ELSE 'revoked'
    END;

    UPDATE public.delivery_handoff_tokens
    SET
      attempt_count = COALESCE(attempt_count, 0) + 1,
      last_attempt_at = NOW(),
      updated_at = NOW()
    WHERE id = v_token_row.id
    RETURNING * INTO v_token_row;

    v_attempt_count := COALESCE(v_token_row.attempt_count, 0);

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
        'attempt_count', v_attempt_count
      )
    );

    RETURN jsonb_build_object(
      'ok', false,
      'reason', v_reason,
      'message', CASE
        WHEN v_reason = 'expired' THEN 'Delivery token expired. Ask the customer for a fresh code.'
        WHEN v_reason = 'used' THEN 'Delivery token has already been used.'
        ELSE 'Delivery token is no longer active. Ask the customer for a fresh code.'
      END,
      'order_id', p_order_id,
      'status', 'picked_up',
      'attempt_count', v_attempt_count
    );
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

    v_attempt_count := COALESCE(v_token_row.attempt_count, 0);

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
        'attempt_count', v_attempt_count
      )
    );

    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'expired',
      'message', 'Delivery token expired. Ask the customer for a fresh code.',
      'order_id', p_order_id,
      'status', 'picked_up',
      'attempt_count', v_attempt_count
    );
  END IF;

  IF v_token_row.token_hash <> v_submitted_hash THEN
    UPDATE public.delivery_handoff_tokens
    SET
      attempt_count = COALESCE(attempt_count, 0) + 1,
      last_attempt_at = NOW(),
      updated_at = NOW()
    WHERE id = v_token_row.id
    RETURNING * INTO v_token_row;

    v_attempt_count := COALESCE(v_token_row.attempt_count, 0);

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
        'attempt_count', v_attempt_count
      )
    );

    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'invalid',
      'message', 'That delivery token is incorrect.',
      'order_id', p_order_id,
      'status', 'picked_up',
      'attempt_count', v_attempt_count
    );
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

  RETURN jsonb_build_object(
    'ok', true,
    'order_id', p_order_id,
    'status', 'delivered'
  );
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

-- ── RLS Setup ─────────────────────────────────────────────────

ALTER TABLE app_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_handoff_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurants_public_read" ON restaurants;
DROP POLICY IF EXISTS "menu_items_public_read" ON menu_items;
DROP POLICY IF EXISTS "customers_own_data" ON customers;
DROP POLICY IF EXISTS "addresses_own_data" ON addresses;
DROP POLICY IF EXISTS "orders_own_data" ON orders;
DROP POLICY IF EXISTS "wallets_own_data" ON wallets;
DROP POLICY IF EXISTS "wallet_txns_own_data" ON wallet_txns;
DROP POLICY IF EXISTS "ratings_own_data" ON ratings;
DROP POLICY IF EXISTS "carts_open_access" ON carts;
DROP POLICY IF EXISTS "cart_items_open_access" ON cart_items;
DROP POLICY IF EXISTS "promo_codes_public_read" ON promo_codes;
DROP POLICY IF EXISTS "support_tickets_open_access" ON support_tickets;
DROP POLICY IF EXISTS "customer_sessions_open_access" ON customer_sessions;
DROP POLICY IF EXISTS "otp_challenges_open_access" ON otp_challenges;
DROP POLICY IF EXISTS "payment_intents_open_access" ON payment_intents;
DROP POLICY IF EXISTS "order_status_events_open_access" ON order_status_events;
DROP POLICY IF EXISTS "app_profiles_self_read" ON app_profiles;
DROP POLICY IF EXISTS "app_profiles_self_update" ON app_profiles;
DROP POLICY IF EXISTS "customers_owner_read" ON customers;
DROP POLICY IF EXISTS "customers_owner_update" ON customers;
DROP POLICY IF EXISTS "addresses_owner_access" ON addresses;
DROP POLICY IF EXISTS "addresses_owner_update" ON addresses;
DROP POLICY IF EXISTS "addresses_owner_delete" ON addresses;
DROP POLICY IF EXISTS "wallets_owner_read" ON wallets;
DROP POLICY IF EXISTS "wallet_txns_owner_read" ON wallet_txns;
DROP POLICY IF EXISTS "orders_shared_access" ON orders;
DROP POLICY IF EXISTS "ratings_owner_read" ON ratings;
DROP POLICY IF EXISTS "carts_owner_read" ON carts;
DROP POLICY IF EXISTS "cart_items_owner_read" ON cart_items;
DROP POLICY IF EXISTS "support_tickets_shared_read" ON support_tickets;
DROP POLICY IF EXISTS "customer_sessions_owner_read" ON customer_sessions;
DROP POLICY IF EXISTS "payment_intents_owner_read" ON payment_intents;
DROP POLICY IF EXISTS "order_status_events_shared_read" ON order_status_events;
DROP POLICY IF EXISTS "order_items_shared_read" ON order_items;
DROP POLICY IF EXISTS "delivery_assignments_shared_read" ON delivery_assignments;
DROP POLICY IF EXISTS "restaurant_staff_members_self_read" ON restaurant_staff_members;
DROP POLICY IF EXISTS "admin_actions_admin_read" ON admin_actions;

CREATE POLICY "app_profiles_self_read" ON app_profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin_role());

CREATE POLICY "app_profiles_self_update" ON app_profiles
  FOR UPDATE USING (id = auth.uid() OR public.is_admin_role())
  WITH CHECK (id = auth.uid() OR public.is_admin_role());

CREATE POLICY "restaurants_public_read" ON restaurants
  FOR SELECT USING (is_active = true OR public.is_restaurant_member(id) OR public.is_admin_role());

CREATE POLICY "menu_items_public_read" ON menu_items
  FOR SELECT USING (
    (COALESCE(is_available, true) = true AND EXISTS (
      SELECT 1 FROM public.restaurants r WHERE r.id = menu_items.restaurant_id AND r.is_active = true
    ))
    OR public.is_restaurant_member(restaurant_id)
    OR public.is_admin_role()
  );

CREATE POLICY "customers_owner_read" ON customers
  FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "customers_owner_update" ON customers
  FOR UPDATE USING (profile_id = auth.uid() OR public.is_admin_role())
  WITH CHECK (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "addresses_owner_access" ON addresses
  FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "addresses_owner_update" ON addresses
  FOR UPDATE USING (profile_id = auth.uid() OR public.is_admin_role())
  WITH CHECK (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "addresses_owner_delete" ON addresses
  FOR DELETE USING (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "wallets_owner_read" ON wallets
  FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "wallet_txns_owner_read" ON wallet_txns
  FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "orders_shared_access" ON orders
  FOR SELECT USING (
    profile_id = auth.uid()
    OR public.is_restaurant_member(restaurant_id)
    OR public.is_assigned_agent(id)
    OR public.is_admin_role()
  );

CREATE POLICY "ratings_owner_read" ON ratings
  FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "carts_owner_read" ON carts
  FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "cart_items_owner_read" ON cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id
        AND (c.profile_id = auth.uid() OR public.is_admin_role())
    )
  );

CREATE POLICY "promo_codes_public_read" ON promo_codes
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "support_tickets_shared_read" ON support_tickets
  FOR SELECT USING (
    profile_id = auth.uid()
    OR public.can_access_order(order_id)
    OR public.is_admin_role()
  );

CREATE POLICY "customer_sessions_owner_read" ON customer_sessions
  FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "payment_intents_owner_read" ON payment_intents
  FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "order_status_events_shared_read" ON order_status_events
  FOR SELECT USING (public.can_access_order(order_id));

CREATE POLICY "order_items_shared_read" ON order_items
  FOR SELECT USING (public.can_access_order(order_id));

CREATE POLICY "delivery_assignments_shared_read" ON delivery_assignments
  FOR SELECT USING (
    public.can_access_order(order_id)
    OR agent_profile_id = auth.uid()
    OR public.is_admin_role()
  );

CREATE POLICY "restaurant_staff_members_self_read" ON restaurant_staff_members
  FOR SELECT USING (profile_id = auth.uid() OR public.is_admin_role());

CREATE POLICY "admin_actions_admin_read" ON admin_actions
  FOR SELECT USING (public.is_admin_role());

SELECT 'Shared backend/domain hardening installed successfully!' AS result;
