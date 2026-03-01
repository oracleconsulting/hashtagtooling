-- Database schema for #TOOLING e-commerce platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('mallet', 'awl', 'coin', 'square')),
  image_url TEXT,
  stock_status TEXT DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'made_to_order', 'out_of_stock')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Commissions table
CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  project_description TEXT NOT NULL,
  budget TEXT,
  timeline TEXT,
  preferred_custom_build TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  paypal_order_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'completed')),
  order_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock_status ON products(stock_status);
CREATE INDEX idx_commissions_status ON commissions(status);
CREATE INDEX idx_commissions_created_at ON commissions(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Add updated_at trigger for products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample products
INSERT INTO products (name, description, price, category, image_url, stock_status) VALUES
  ('Walnut Carving Mallet', 'Beautifully turned carving mallet in black walnut with brass transition', 89.99, 'mallet', 'https://placehold.co/600x400/3D2817/white?text=Walnut+Mallet', 'in_stock'),
  ('Maple Detailing Mallet', 'Precision turned detailing mallet in hard maple with copper accent', 79.99, 'mallet', 'https://placehold.co/600x400/E8D5B7/333?text=Maple+Mallet', 'in_stock'),
  ('Rosewood Square Mallet', 'Square framing mallet in exotic rosewood with aluminium transition', 129.99, 'mallet', 'https://placehold.co/600x400/65000B/white?text=Rosewood+Mallet', 'made_to_order'),
  ('Precision Marking Awl', 'Hand-turned marking awl with ebony handle', 45.00, 'awl', 'https://placehold.co/600x400/282828/white?text=Marking+Awl', 'in_stock'),
  ('Engineer''s Square 6"', 'Precision machined 6" engineer''s square', 65.00, 'square', 'https://placehold.co/600x400/C0C0C0/333?text=Engineer+Square', 'in_stock'),
  ('Titanium EDC Coin', 'Laser-engraved EDC coin in aerospace titanium', 35.00, 'coin', 'https://placehold.co/600x400/8C92AC/white?text=Ti+Coin', 'in_stock');



