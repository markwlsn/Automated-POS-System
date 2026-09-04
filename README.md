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

| Role | Email | Password | Portal / Access |
| --- | --- | --- | --- |
| **Owner** | `owner@test.com` | `Password123!` | Analytics Dashboard, inventory controls, POS rules (`/owner`) |
| **Staff** | `staff@test.com` | `Password123!` | Counter POS, scale input, queue calling (`/staff`) |
| **Customer** | `customer@test.com` | `Password123!` | Digital queue ticket dispenser, fresh meat price board (`/shop`) |

---

## ⚖️ POS Store Rules & Operational Laws

The system enforces retail limits across both backend repositories and frontend checkout:

- **Minimum Order Amount**: ₱50.00 per transaction
- **Maximum Order Amount**: ₱50,000.00 per transaction
- **Daily Branch Capacity**: 500 orders/day per branch
- **Customer Daily Cap**: 10 orders/day per registered customer
- **Weight Bounds**: 0.05 kg (50g) to 100.0 kg per line item

---

## 💻 Running in VS Code Integrated Terminal

1. **Terminal 1 (Backend API)**:
   ```powershell
   npm run dev
   ```
2. **Terminal 2 (Frontend UI)**:
   ```powershell
   cd frontend
   npm run dev
   ```
3. Open your browser to **http://localhost:5173**.

---

## 📖 Documentation & Architecture

- [System Architecture](docs/ARCHITECTURE.md)
- [POS Operational Rules](docs/POS_RULES.md)
- [API Specifications](docs/API.md)
- [Quality Assurance Plan](docs/QA_PLAN.md)
