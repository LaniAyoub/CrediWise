-- Pre-populate keycloak_id for seeded gestionnaires so that profile lookups
-- work immediately via the sub-UUID strategy (strategy 3 in ProfileResource),
-- even when email/preferred_username are absent from the access token.
--
-- For sample users (001-007) the Keycloak sub UUID equals the gestionnaire DB id.
-- For the admin user the IDs differ:
--   Keycloak sub  : 00000000-0000-0000-0000-000000000010
--   gestionnaire id: 00000000-0000-0000-0000-000000000002

UPDATE gestionnaires
SET keycloak_id = id
WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440007'
) AND keycloak_id IS NULL;

UPDATE gestionnaires
SET keycloak_id = '00000000-0000-0000-0000-000000000010'
WHERE email = 'admin@creditwise.com'
  AND keycloak_id IS NULL;
