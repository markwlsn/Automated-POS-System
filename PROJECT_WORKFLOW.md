# Backend-First Full-Stack Workflow: Automated POS System

This file serves as the active project playbook for Automated POS System. It is maintained across all phases from backend development to frontend integration, QA, and deployment.

## Project identity

| Item | Value |
| --- | --- |
| Project | Automated POS System |
| Absolute root | `C:\Users\User.MIS\Documents\Projects\Automated-POS-System` |
| Product goal | An automated meat shop point-of-sale, customer queue management, and inventory tracking system. |
| Primary users | Meat shop staff, customers (kiosk/queue/pre-order), and shop owners. |
| Current phase | `QA / DEMO` |
| Backend stack | Node.js (v24), Express, ES Modules, SQLite (local/testing) / PostgreSQL (production/Supabase) |
| Frontend stack | React 19, Vite 8, TailwindCSS 3 |
| Auth strategy | JWT Bearer tokens with Role-Based Access Control (`owner`, `staff`, `customer`) |
| Database | SQLite (`better-sqlite3` for local dev/testing) & PostgreSQL DDL migrations |
| Local API URL | `http://localhost:3000` |
| Local UI URL | `http://localhost:5173` |
| Owner | Mark Wilson / Automated POS Team |

## Rules for every agent

1. Read this file, `README.md`, API documentation, environment examples, current handoff, and `git status` before editing.
2. Preserve existing UI, user flows, API contracts, architecture, and unrelated user changes unless the task explicitly says otherwise.
3. Make the smallest coherent change that solves the assigned task. Do not redesign or migrate the project as a side effect.
4. Never commit, print, paste, log, or expose passwords, tokens, API keys, database credentials, or service-role secrets.
5. Do not add direct frontend-to-database/auth-provider calls when the architecture requires frontend-to-backend API calls.
6. Do not use destructive Git commands, force-push, delete data, deploy, or change external accounts without explicit authorization.
7. Treat API request/response/error shapes as contracts. When changing one, update backend, frontend client, tests, and docs together.
8. Client-side validation improves UX; server-side validation is always required for security.
9. Run relevant tests, build, lint, and audit before claiming completion.
10. Update `docs/AGENT_HANDOFF.md` when current phase, verification results, API contract, risks, or next steps change.

## Delivery phases

### Phase 1: Discovery (Completed)

Defined:
- Product goal: Meat shop POS, inventory tracking, queue management, and owner sales reporting.
- Target users: Meat shop staff at counter, shop owner, customers.
- Core entities: Shop, Branch, Profile/User, Category, Product, Inventory, Order, OrderItem, Payment, Receipt, QueueTicket, ActivityLog.
- Backend/Frontend separation: Frontend in `frontend/`, Backend at root `src/`.

### Phase 2: Backend first (Active)

Build the backend independent of any UI:
- Configuration validation and `.env.example`
- Database schema/migrations and ownership/role rules
- Authentication and authorization middleware (JWT + RBAC)
- Request validation schemas (Zod)
- Controller / Service / Repository layer separation
- Health endpoint (`/health`)
- Consistent data/error response wrappers:
  - `{ "data": { ... } }`
  - `{ "error": { "message": "...", "code": "...", "details": { ... } } }`
- Backend tests, lint, build, dependency audit
- `docs/API.md` with every required user-facing endpoint

Exit gate: all core backend checks pass, the principal flow can be tested by API alone, and no private key is needed by a browser.

### Phase 3: Freeze the API contract

Document in `docs/API.md` before frontend integration.

### Phase 4: Frontend and API integration

Migrate frontend from direct Supabase SDK calls to centralized Backend API client (`frontend/src/api/client.js`).

### Phase 5: End-to-end QA

Validate full user journeys (owner, staff, customer) using real test accounts against backend API.

### Phase 6: Deployment preparation

CORS, HTTPS, environment variables, production build.

## Quality gates

| Area | Minimum gate |
| --- | --- |
| Backend | Build/type check, lint, tests, dependency audit |
| Frontend | Build/type check, tests, dependency audit |
| API | Contract tests for core success/error routes |
| Security | Auth checks, malformed input, secret review, role isolation |
| UX | Responsive/touch layout, receipt print readiness, error states |

Commands:
```powershell
# Backend (root)
npm test
npm run lint
npm audit --omit=dev

# Frontend
cd frontend
npm test
npm run build
npm audit --omit=dev
```
