# Automated POS System (Meat Shop)

A production-ready retail meat shop Point of Sale (POS), customer queue management, and inventory tracking system built following the **Backend-First Full-Stack Workflow Template**.

---

## 🏛️ Architecture & Stack

- **Backend** (`/`):
  - **Runtime**: Node.js (v24+)
  - **Framework**: Express (ES Modules)
  - **Security**: Helmet, CORS, JWT (Bearer tokens), bcryptjs password hashing
  - **Validation**: Zod schema validation
  - **Database**: SQLite (via Node 24 native `node:sqlite` DatabaseSync) with full migration DDL & seed scripts in `scripts/`
  - **Architecture**: Strict layer separation (`controllers/`, `services/`, `repositories/`, `middleware/`, `utils/`)
  - **Standard API Envelope**:
    - Success: `{ "data": ... }`
    - Error: `{ "error": { "message": "...", "code": "...", "details": { ... } } }`
- **Frontend** (`/frontend`):
  - **Framework**: React 19, Vite 8, Tailwind CSS 3
  - **State**: React Hooks & Contexts
  - **Features**: Staff POS terminal, product catalog filtering, touch keypad for weight input, cash & e-wallet payments, thermal receipt formatting, order history.

---

## 📁 Repository Structure

```text
Automated-POS-System/
├── src/                     # Backend API source
│   ├── app.js               # Express application configuration
│   ├── server.js            # Server entry point & graceful shutdown
│   ├── config/              # Environment schema & business constants
│   ├── controllers/         # HTTP request handlers
│   ├── db/                  # Database connection manager
│   ├── middleware/          # Auth JWT, RBAC, Zod validation, error handler
│   ├── repositories/        # SQL data access layer
│   ├── routes/              # Express API v1 routers
│   ├── services/            # Core business logic & transactions
│   └── utils/               # Order & receipt numbering, formatters
├── tests/                   # Backend automated test suite (node:test)
├── scripts/                 # Migrations & seed scripts
│   ├── migrations/          # SQL schema migrations
│   └── seeds/               # Seed data for demo shop & products
├── docs/                    # Architecture & operational documentation
│   ├── API.md               # Frozen API specification
│   ├── QA_PLAN.md           # QA test cases & verification procedures
│   ├── AGENT_HANDOFF.md     # Agent handoff status & next steps
│   ├── PRIVACY_NOTICE.md    # Data privacy policy
│   └── TERMS_OF_SERVICE.md  # Terms of service
├── frontend/                # Isolated browser application
│   ├── src/                 # React components, pages, hooks
│   └── package.json         # Frontend dependencies & scripts
├── PROJECT_WORKFLOW.md      # Active project workflow playbook
└── package.json             # Backend dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+ (tested on Node.js v24.19.0)
- npm 10+

### 1. Backend Setup & Run

```powershell
# In repository root
npm install

# Run database migrations and seed data
npm run db:migrate
npm run db:seed

# Start development server (auto-reloads on file changes)
npm run dev

# Or start in production mode
npm start
```
The API server will listen on `http://localhost:3000`.  
Health check endpoint: `http://localhost:3000/health`.

### 2. Frontend Setup & Run

```powershell
cd frontend
npm install
npm run dev
```
The Vite development server will open at `http://localhost:5173`.

---

## 🧪 Quality Gates & Verification

Run backend test suite, linting, and security audits:

```powershell
# Run all backend unit & integration tests
npm test

# Run code linter
npm run lint

# Run security audit (omitting dev dependencies)
npm audit --omit=dev
```

Run frontend checks:

```powershell
cd frontend
npm test
npm run lint
npm run build
npm audit --omit=dev
```

---

## 🔑 Demo Credentials

| Role | Email | Password | Assigned Branch |
| --- | --- | --- | --- |
| **Owner** | `owner@test.com` | `Password123!` | Dela Cruz Meat Shop (All) |
| **Staff** | `staff@test.com` | `Password123!` | Main Branch - Poblacion |
| **Customer** | `customer@test.com` | `Password123!` | Online / Kiosk |

---

## 📖 API Documentation

Detailed endpoint request/response contracts, schemas, error codes, and examples are documented in [docs/API.md](docs/API.md).
