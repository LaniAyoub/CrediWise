-- ============================================================
-- Update status table with complete lifecycle values
-- ============================================================

-- Delete old status values
DELETE FROM status WHERE id_status IN ('DRAFT', 'SUBMITTED', 'VALIDATED', 'REJECTED');

-- Insert new status values with complete lifecycle
INSERT INTO status (id_status, libelle) VALUES
    ('DRAFT',                    'Brouillon'),
    ('SUBMITTED',                'Soumise'),
    ('ANALYSE',                  'Analyse'),
    ('CHECK_BEFORE_COMMITTEE',   'Vérification avant comité'),
    ('CREDIT_RISK_ANALYSIS',     'Analyse du risque crédit'),
    ('COMMITTEE',                'Comité'),
    ('WAITING_CLIENT_APPROVAL',  'En attente de l''approbation client'),
    ('READY_TO_DISBURSE',        'Prêt à débourser'),
    ('DISBURSE',                 'Déboursée'),
    ('REJECTED',                 'Rejetée')
ON CONFLICT (id_status) DO NOTHING;
