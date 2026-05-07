# frontend
React 19 + Vite + TailwindCSS credit management UI.

Start:     cd frontend && npm run dev        (http://localhost:3000)
Build:     cd frontend && npm run build
Lint:      cd frontend && npm run lint
Typecheck: cd frontend && npx tsc --noEmit
Preview:   cd frontend && npm run preview

Backend: talks to gestionnaire on http://localhost:8080 (VITE_API_BASE_URL in .env)
Auth: Keycloak OIDC via keycloak-js; tokens are obtained/refreshed by the adapter and attached by Axios interceptor.
i18n: all strings in src/locales/ — add keys to both locale files.
Dark mode: class-based toggle (not media query).

Key dirs:
- src/services/ → all Axios API calls (one file per domain area)
- src/types/    → TypeScript types for API responses
- src/hooks/    → custom hooks including auth
- src/pages/    → route-level components
- src/components/ → reusable UI components

Missing: no test suite yet. Use /add-test command to add Vitest tests.
