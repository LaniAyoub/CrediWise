-- V4: Add admin@crediwise.com gestionnaire
-- The V1 seed used admin@creditwise.com (typo). The actual Keycloak account
-- uses admin@crediwise.com. This migration inserts the correct record so that
-- ProfileResource.getCurrentUser() can resolve the JWT email to a DB row.
INSERT INTO gestionnaires (
    id, email, cin, num_telephone, first_name, last_name,
    date_of_birth, address, role, is_active
) VALUES (
    '00000000-0000-0000-0000-000000000010',
    'admin@crediwise.com',
    'ADMIN0010',
    '+21600000010',
    'Admin',
    'CrediWise',
    '2000-01-01',
    'Tunis, Tunisia',
    'SUPER_ADMIN',
    true
) ON CONFLICT (email) DO NOTHING;
