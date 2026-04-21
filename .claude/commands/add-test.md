Add tests to a CrediWise service (project currently has 0 tests — priority gap).

Usage: /add-test [service: gestionnaire|client|nouvelle_demande|analyse|frontend] [what to test]

For Java services (Quarkus):
1. Create test class in src/test/java/org/acme/ (mirror the main source structure)
2. Use @QuarkusTest annotation
3. Use RestAssured for REST endpoint tests
4. Use @TestTransaction for DB tests with Panache
5. Mock gRPC clients with @InjectMock where needed
6. Test: happy path + one error case minimum per endpoint
7. Run: mvn test to verify

For frontend (React):
1. Use Vitest + React Testing Library (install if not present: npm i -D vitest @testing-library/react)
2. Create test next to component: Component.tsx → Component.test.tsx
3. Test: renders correctly + key user interaction
4. Run: npx vitest run

Priority order for first tests:
1. gestionnaire: auth endpoints (POST /auth/login, token validation)
2. client: CRUD operations
3. frontend: form validation with Zod schemas
