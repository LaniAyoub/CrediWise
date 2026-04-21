# Frontend rules for CrediWise (React + TypeScript)

Stack:
- React 19.2 with functional components and hooks only (no class components)
- TypeScript strict mode — no `any` types, no @ts-ignore
- TailwindCSS 3.4 for all styling — no inline style objects, no CSS modules
- Dark mode: class-based (user toggle), not media query

Forms:
- Always use React Hook Form + Zod schema validation
- Define Zod schema first, infer TypeScript type from it: z.infer<typeof schema>
- Never use uncontrolled inputs outside of React Hook Form

API calls:
- All HTTP via Axios in src/services/ (never fetch() directly in components)
- Base URL from import.meta.env.VITE_API_BASE_URL (gestionnaire port 8080)
- Other services require their own env vars — never hardcode ports
- Handle errors from Axios and show via React Hot Toast

Routing:
- React Router 7 — use useNavigate(), not window.location
- Route protection based on JWT role claims (FRONT_OFFICE / SUPER_ADMIN)

i18n:
- All user-visible strings must use i18next: useTranslation() hook
- Add new keys to BOTH locale files in src/locales/

Types:
- All API response types defined in src/types/
- Shared types used across services defined once, not duplicated

Exports:
- Named exports only, no default exports (except page components for router lazy loading)
- Components: PascalCase files and names
- Hooks: use prefix, camelCase files (useAuth.ts)
- Services: camelCase (authService.ts)

Code quality:
- Run npm run lint before every commit
- Run npx tsc --noEmit before every commit
- Prettier not configured — do not add it without aligning team
