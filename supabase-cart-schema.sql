-- ============================================================
-- BiteBlast — Cart and Customer Flow Extension
-- Run this after supabase-schema.sql in: Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  promo_code TEXT,
  discount_rate DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INT NOT NULL CHECK (quantity > 0),
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cart_id, menu_item_id)
);

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_rate DECIMAL(5,4) NOT NULL CHECK (discount_rate >= 0 AND discount_rate <= 1),
  is_active BOOLEAN DEFAULT true,
  max_uses INT,
  used_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_customer_id ON carts(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_menu_item_id ON cart_items(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "carts_open_access" ON carts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "cart_items_open_access" ON cart_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "promo_codes_public_read" ON promo_codes FOR SELECT USING (is_active = true);

INSERT INTO promo_codes (code, discount_rate, is_active, max_uses)
VALUES
  ('GLOW10', 0.10, true, 1000),
  ('VELVET15', 0.15, true, 500)
ON CONFLICT (code) DO NOTHING;

SELECT 'Cart schema created successfully!' AS result;
