-- Remove legacy product IDs (MICRO_CREDIT, CREDIT_PME, etc.) — replaced by numeric IDs 101-110
DELETE FROM product WHERE product_id IN ('MICRO_CREDIT', 'CREDIT_PME', 'CREDIT_CONSO', 'CREDIT_IMMO', 'CREDIT_EQUIPEMENT');
