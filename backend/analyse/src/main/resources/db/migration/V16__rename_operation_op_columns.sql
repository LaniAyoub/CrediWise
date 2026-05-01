-- Rename rule operator columns for clarity:
-- 'operation' (lower bound operator) → op_inf
-- 'op' (upper bound operator)        → op_sup
-- Each bound now has its own named operator column.

ALTER TABLE regle_affichage RENAME COLUMN operation TO op_inf;
ALTER TABLE regle_affichage RENAME COLUMN op TO op_sup;
