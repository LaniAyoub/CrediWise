-- Fix sequence for scoring_results table
-- The sequence was created with uppercase name but Hibernate looks for lowercase
-- Drop the incorrectly named sequence and create it with the correct name

DROP SEQUENCE IF EXISTS "scoring_results_SEQ" CASCADE;
CREATE SEQUENCE IF NOT EXISTS scoring_results_seq START WITH 1 INCREMENT BY 50;
