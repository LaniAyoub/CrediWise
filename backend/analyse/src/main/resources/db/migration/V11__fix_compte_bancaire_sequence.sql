-- Fix: V10 used BIGSERIAL which creates compte_bancaire_id_seq,
-- but Hibernate/Panache expects compte_bancaire_seq (INCREMENT BY 50).
CREATE SEQUENCE IF NOT EXISTS compte_bancaire_seq START WITH 1 INCREMENT BY 50;
ALTER TABLE compte_bancaire ALTER COLUMN id SET DEFAULT nextval('compte_bancaire_seq');
SELECT setval('compte_bancaire_seq', COALESCE((SELECT MAX(id) FROM compte_bancaire), 0) + 1);
