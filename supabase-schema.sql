-- ============================================================
-- BiteBlast — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Tables ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  fssai_license TEXT,
  address JSONB NOT NULL DEFAULT '{}',
  cuisine_types TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 4.0,
  delivery_time_min INT DEFAULT 35,
  min_order DECIMAL(10,2) DEFAULT 100,
  delivery_fee DECIMAL(10,2) DEFAULT 20,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_veg BOOLEAN DEFAULT false,
  is_bestseller BOOLEAN DEFAULT false,
  preparation_time_min INT DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT,
  flat_no TEXT,
  building TEXT,
  street TEXT,
  area TEXT,
  city TEXT DEFAULT 'Pune',
  state TEXT DEFAULT 'Maharashtra',
  pincode TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_txns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('credit', 'debit')),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  restaurant_id UUID REFERENCES restaurants(id),
  status TEXT DEFAULT 'pending'
    CHECK (status IN (
      'pending','confirmed','preparing','ready_for_pickup',
      'agent_assigned','picked_up','in_transit',
      'delivered','cancelled','refunded'
    )),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 20,
  platform_fee DECIMAL(10,2) DEFAULT 5,
  gst DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tip DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('upi','card','wallet','cod')),
  payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  delivery_address JSONB NOT NULL DEFAULT '{}',
  delivery_token TEXT,
  eta_minutes INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id),
  score INT CHECK (score >= 1 AND score <= 5),
  tags TEXT[] DEFAULT '{}',
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ─────────────────────────────────────────

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_txns ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Public: browse restaurants and menu without login
CREATE POLICY "restaurants_public_read" ON restaurants FOR SELECT USING (is_active = true);
CREATE POLICY "menu_items_public_read" ON menu_items FOR SELECT USING (true);

-- Customer: own data only
CREATE POLICY "customers_own_data" ON customers FOR ALL USING (true);  -- anon insert allowed for registration
CREATE POLICY "addresses_own_data" ON addresses FOR ALL USING (true);
CREATE POLICY "orders_own_data" ON orders FOR ALL USING (true);
CREATE POLICY "wallets_own_data" ON wallets FOR ALL USING (true);
CREATE POLICY "wallet_txns_own_data" ON wallet_txns FOR ALL USING (true);
CREATE POLICY "ratings_own_data" ON ratings FOR ALL USING (true);

-- ── Seed Data ───────────────────────────────────────────────────

INSERT INTO restaurants (name, owner_name, phone, cuisine_types, rating, delivery_time_min, min_order, delivery_fee, address, image_url) VALUES
(
  'Spice Garden', 'Rajesh Kumar',
  '+919876543210',
  ARRAY['North Indian', 'Biryani', 'Mughlai'],
  4.3, 32, 150, 20,
  '{"street":"FC Road","area":"Shivaji Nagar","city":"Pune","state":"Maharashtra","pincode":"411005"}',
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400'
),
(
  'Kitchen Story', 'Priya Sharma',
  '+919876543211',
  ARRAY['Italian', 'Pizzas', 'Pasta'],
  4.6, 28, 200, 15,
  '{"street":"JM Road","area":"Deccan","city":"Pune","state":"Maharashtra","pincode":"411004"}',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400'
),
(
  'Burger Junction', 'Amit Patel',
  '+919876543212',
  ARRAY['American', 'Burgers', 'Fast Food'],
  4.1, 25, 100, 20,
  '{"street":"Koregaon Park Road","area":"Koregaon Park","city":"Pune","state":"Maharashtra","pincode":"411001"}',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
),
(
  'Sushi Zen', 'Yuki Tanaka',
  '+919876543213',
  ARRAY['Japanese', 'Sushi', 'Asian'],
  4.7, 40, 300, 30,
  '{"street":"Kalyani Nagar","area":"Yerawada","city":"Pune","state":"Maharashtra","pincode":"411006"}',
  'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400'
),
(
  'The Biryani House', 'Imran Khan',
  '+919876543214',
  ARRAY['Hyderabadi', 'Biryani', 'Kebabs'],
  4.4, 35, 180, 25,
  '{"street":"Camp Road","area":"Camp","city":"Pune","state":"Maharashtra","pincode":"411001"}',
  'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400'
);

-- Get restaurant IDs for menu inserts
DO $$
DECLARE
  spice_garden_id UUID;
  kitchen_story_id UUID;
  burger_junction_id UUID;
  sushi_zen_id UUID;
  biryani_house_id UUID;
BEGIN
  SELECT id INTO spice_garden_id FROM restaurants WHERE name = 'Spice Garden' LIMIT 1;
  SELECT id INTO kitchen_story_id FROM restaurants WHERE name = 'Kitchen Story' LIMIT 1;
  SELECT id INTO burger_junction_id FROM restaurants WHERE name = 'Burger Junction' LIMIT 1;
  SELECT id INTO sushi_zen_id FROM restaurants WHERE name = 'Sushi Zen' LIMIT 1;
  SELECT id INTO biryani_house_id FROM restaurants WHERE name = 'The Biryani House' LIMIT 1;

  -- Spice Garden menu
  INSERT INTO menu_items (restaurant_id, name, description, price, category, is_veg, is_bestseller) VALUES
    (spice_garden_id, 'Chicken Biryani', 'Aromatic basmati rice with tender chicken, slow-cooked with spices', 299, 'Biryani', false, true),
    (spice_garden_id, 'Mutton Rogan Josh', 'Kashmiri-style slow-cooked lamb curry', 349, 'Curry', false, false),
    (spice_garden_id, 'Paneer Tikka Masala', 'Grilled cottage cheese in rich tomato gravy', 229, 'Vegetarian', true, true),
    (spice_garden_id, 'Garlic Naan', 'Soft leavened bread topped with garlic butter', 49, 'Bread', true, false),
    (spice_garden_id, 'Dal Makhani', 'Creamy black lentils simmered overnight', 179, 'Vegetarian', true, false),
    (spice_garden_id, 'Chicken Seekh Kebab', 'Minced chicken kebabs grilled in tandoor', 269, 'Kebabs', false, false);

  -- Kitchen Story menu
  INSERT INTO menu_items (restaurant_id, name, description, price, category, is_veg, is_bestseller) VALUES
    (kitchen_story_id, 'Margherita Pizza', 'Classic tomato, mozzarella, fresh basil', 299, 'Pizza', true, true),
    (kitchen_story_id, 'Pepperoni Pizza', 'Double pepperoni with mozzarella', 399, 'Pizza', false, true),
    (kitchen_story_id, 'Arrabiata Pasta', 'Penne in spicy tomato sauce with garlic', 249, 'Pasta', true, false),
    (kitchen_story_id, 'Tiramisu', 'Classic Italian coffee-flavoured layered dessert', 199, 'Dessert', true, false),
    (kitchen_story_id, 'Bruschetta', 'Toasted bread with fresh tomatoes and basil', 149, 'Starters', true, false),
    (kitchen_story_id, 'Chicken Alfredo', 'Fettuccine in creamy parmesan sauce with grilled chicken', 349, 'Pasta', false, false);

  -- Burger Junction menu
  INSERT INTO menu_items (restaurant_id, name, description, price, category, is_veg, is_bestseller) VALUES
    (burger_junction_id, 'Classic Cheeseburger', 'Angus beef patty, cheddar, lettuce, tomato, special sauce', 199, 'Burgers', false, true),
    (burger_junction_id, 'BBQ Bacon Burger', 'Beef patty, crispy bacon, onion rings, BBQ sauce', 279, 'Burgers', false, false),
    (burger_junction_id, 'Veggie Delight', 'Plant-based patty, avocado, sprouts, chipotle mayo', 199, 'Burgers', true, true),
    (burger_junction_id, 'Loaded Fries', 'Crispy fries with cheese sauce, bacon bits, jalapeños', 129, 'Sides', false, false),
    (burger_junction_id, 'Onion Rings', 'Beer-battered crispy onion rings', 99, 'Sides', true, false),
    (burger_junction_id, 'Chocolate Shake', 'Thick creamy chocolate milkshake', 119, 'Beverages', true, false);

  -- Sushi Zen menu
  INSERT INTO menu_items (restaurant_id, name, description, price, category, is_veg, is_bestseller) VALUES
    (sushi_zen_id, 'Salmon Nigiri (2 pcs)', 'Fresh Atlantic salmon over pressed vinegar rice', 299, 'Nigiri', false, true),
    (sushi_zen_id, 'Rainbow Roll', 'Crab, avocado, topped with assorted sashimi', 449, 'Rolls', false, true),
    (sushi_zen_id, 'Dragon Roll', 'Eel, cucumber, avocado, topped with avocado slices', 499, 'Rolls', false, false),
    (sushi_zen_id, 'Edamame', 'Steamed soybeans with sea salt', 149, 'Starters', true, false),
    (sushi_zen_id, 'Miso Soup', 'Traditional Japanese soup with tofu and wakame', 99, 'Soup', true, false),
    (sushi_zen_id, 'Vegetable Tempura Roll', 'Assorted tempura-fried vegetables in a roll', 349, 'Rolls', true, false);

  -- The Biryani House menu
  INSERT INTO menu_items (restaurant_id, name, description, price, category, is_veg, is_bestseller) VALUES
    (biryani_house_id, 'Hyderabadi Chicken Biryani', 'Dum-cooked with saffron, caramelized onions, whole spices', 329, 'Biryani', false, true),
    (biryani_house_id, 'Special Dum Biryani (Mutton)', 'Slow-cooked mutton biryani with secret spices', 449, 'Biryani', false, true),
    (biryani_house_id, 'Vegetable Biryani', 'Fragrant rice with seasonal vegetables and paneer', 229, 'Biryani', true, false),
    (biryani_house_id, 'Chicken 65', 'Spicy deep-fried chicken appetizer', 219, 'Starters', false, false),
    (biryani_house_id, 'Raita', 'Yogurt with cucumber, mint, and roasted cumin', 59, 'Sides', true, false),
    (biryani_house_id, 'Mirchi Ka Salan', 'Green chillies in peanut and sesame curry', 129, 'Vegetarian', true, false);
END $$;

SELECT 'Schema and seed data created successfully!' as result;
