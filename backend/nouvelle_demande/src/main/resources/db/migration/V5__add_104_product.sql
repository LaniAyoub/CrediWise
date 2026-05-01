INSERT INTO product (product_id, type, name) VALUES
('104',      'Auto',     'Product Auto')
ON CONFLICT (product_id) DO NOTHING;