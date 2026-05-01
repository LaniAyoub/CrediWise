-- Fix product type codes for IDs 101-110 (were NULL, now use proper type enum values)
UPDATE product SET type = 'MICRO'     WHERE product_id = '101';
UPDATE product SET type = 'PME'       WHERE product_id = '102';
UPDATE product SET type = 'CONSUMER'  WHERE product_id = '103';
UPDATE product SET type = 'MORTGAGE'  WHERE product_id = '105';
UPDATE product SET type = 'EQUIPMENT' WHERE product_id = '110';
