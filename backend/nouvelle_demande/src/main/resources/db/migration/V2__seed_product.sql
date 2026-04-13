-- Seed / update product reference data

INSERT INTO product (product_id, type, name) VALUES
                                                 ('101', NULL, 'Crédit Micro Tatouir'),
                                                 ('102', NULL, 'Crédit TPE Mostakbali'),
                                                 ('103', NULL, 'Crédit PME Imtiez'),
                                                 ('105', NULL, 'Crédit EL BEYA'),
                                                 ('110', NULL, 'Crédit Agricole Saba')
    ON CONFLICT (product_id)
DO UPDATE SET
    type = EXCLUDED.type,
           name = EXCLUDED.name;