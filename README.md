# Automated POS System (Meat Shop)

A production-ready retail meat shop Point of Sale (POS), customer queue ticketing system, and real-time inventory tracking application built following the **Backend-First Full-Stack Architecture**.

---

## 📋 Table of Contents
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Prerequisites (Before You Begin)](#-prerequisites-before-you-begin)
- [Step-by-Step Setup Guide (VS Code Terminal)](#-step-by-step-setup-guide-vs-code-terminal)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Open in Visual Studio Code](#step-2-open-in-visual-studio-code)
  - [Step 3: Open the Integrated Terminal in VS Code](#step-3-open-the-integrated-terminal-in-vs-code)
  - [Step 4: Setup & Run Backend API (Terminal 1)](#step-4-setup--run-backend-api-terminal-1)
  - [Step 5: Setup & Run Frontend Client (Terminal 2)](#step-5-setup--run-frontend-client-terminal-2)
  - [Step 6: Open the App in Your Browser](#step-6-open-the-app-in-your-browser)
- [🔑 Demo Login Accounts](#-demo-login-accounts)
- [🧪 Running Automated Tests & Linting](#-running-automated-tests--linting)
- [🛠️ Troubleshooting & Common Setup Errors](#️-troubleshooting--common-setup-errors)
- [⚖️ POS Store Rules & Retail Limits](#️-pos-store-rules--retail-limits)
- [📁 Project Directory Structure](#-project-directory-structure)
- [📖 Additional Documentation](#-additional-documentation)

---

## 🏛️ Architecture & Tech Stack

- **Backend** (Root `/`):
  - **Runtime**: Node.js (v22.12.0+ or v24+)
  - **Framework**: Express 4 (ES Modules)
  - **Database**: Zero-configuration local SQLite via Node's native `node:sqlite` (`DatabaseSync` with WAL mode & foreign key enforcement)
  - **Security & Validation**: JWT Bearer tokens, bcryptjs, Helmet, CORS, and Zod schema validation
  - **Design Pattern**: Layered architecture (`controllers` → `services` → `repositories` → `db`)
  - **Standard API Envelope**:
    - Success: `{ "data": ... }`
    - Error: `{ "error": { "message": "...", "code": "...", "details": { ... } } }`
- **Frontend** (`/frontend`):
  - **Framework**: React 19, Vite 8, Tailwind CSS 3
  - **Routing & State**: React Router 7, Context API & custom hooks
  - **Key Features**: Digital queue ticket dispenser, staff POS counter with touch weight keypad, barcode/cut filtering, cash & e-wallet checkout, receipt printer modal, and owner analytics dashboard.

---

## 💻 Prerequisites (Before You Begin)

Ensure the following tools are installed on the PC:

1. **Git**: [Download Git](https://git-scm.com/downloads) (verify with `git --version`)
2. **Node.js**: **Version 22.12.0+ or Node.js 24+** (LTS or Current)
   - [Download Node.js](https://nodejs.org/)
   - Verify by running `node -v` and `npm -v`.
   - > **Why Node 22.12+ or 24+?** This project uses Node's native built-in `node:sqlite` module. **No MySQL, PostgreSQL, XAMPP, or Docker installations are required.**
3. **Visual Studio Code**: [Download VS Code](https://code.visualstudio.com/)

---

## 🚀 Step-by-Step Setup Guide (VS Code Terminal)

### Step 1: Clone the Repository

Open your system terminal (PowerShell, Command Prompt, or Git Bash) and run:

```bash
git clone https://github.com/markwlsn/Automated-POS-System.git
cd Automated-POS-System
```

---

### Step 2: Open in Visual Studio Code

Launch VS Code in the project folder:

```bash
code .
```

*(Alternatively: Open VS Code manually, click **File > Open Folder...**, and select the cloned `Automated-POS-System` directory).*

---

### Step 3: Open the Integrated Terminal in VS Code

1. Press **`Ctrl + \``** (backtick) or go to the top menu and select **Terminal > New Terminal**.
2. By default, the terminal opens in the repository root directory (`Automated-POS-System`).
3. To run both the **Backend** and **Frontend** concurrently, open two terminal panes:
   - Click the **Split Terminal** icon (or press **`Ctrl + Shift + 5`**) in the terminal toolbar.
   - You will now have **Terminal 1 (Backend)** and **Terminal 2 (Frontend)** side-by-side.

> **Windows PowerShell Note**: If you encounter an execution policy error (`running scripts is disabled on this system`), run this one-time command in the terminal:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

---

### Step 4: Setup & Run Backend API (Terminal 1)

Make sure you are in the **project root** directory in Terminal 1.

#### 1. Copy Environment Configuration
- **PowerShell (Windows)**:
  ```powershell
  Copy-Item .env.example .env
  ```
- **Bash / macOS / Linux**:
  ```bash
  cp .env.example .env
  ```

#### 2. Install Backend Dependencies
```powershell
npm install
```

#### 3. Run Database Migrations & Seed Demo Data
This creates your local SQLite database file at `./data/pos.sqlite` and loads sample categories, meat cuts, inventory levels, and demo accounts:
```powershell
npm run db:migrate
npm run db:seed
```

#### 4. Start the Backend API Server
```powershell
npm run dev
```
- The backend will start on **`http://localhost:3000`** with live reload enabled.
- Verify it is running by checking health in your browser: [http://localhost:3000/health](http://localhost:3000/health) (returns `{ "status": "ok" }`).

---

### Step 5: Setup & Run Frontend Client (Terminal 2)

Switch to **Terminal 2** (or open a new terminal tab with `Terminal > New Terminal`).

#### 1. Navigate to the Frontend Directory
```powershell
cd frontend
```

#### 2. Copy Frontend Environment Configuration
- **PowerShell (Windows)**:
  ```powershell
  Copy-Item .env.example .env
  ```
- **Bash / macOS / Linux**:
  ```bash
  cp .env.example .env
  ```

#### 3. Install Frontend Dependencies
```powershell
npm install
```

#### 4. Start the Vite Development Server
```powershell
npm run dev
```
- The Vite server will launch and display the local development link: **`http://localhost:5173`**.

---

### Step 6: Open the App in Your Browser

Navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

Log in with any of the seeded demo accounts below to explore different role portals.

---

## 🔑 Demo Login Accounts

All accounts use the password: **`Password123!`**

| Role | Email | Password | Accessible Portal / URL | Features |
| :--- | :--- | :--- | :--- | :--- |
| **Store Owner** | `owner@test.com` | `Password123!` | [http://localhost:5173/owner](http://localhost:5173/owner) | Sales KPIs, revenue summaries, product catalog management, stock threshold adjustments. |
| **Counter Staff** | `staff@test.com` | `Password123!` | [http://localhost:5173/staff](http://localhost:5173/staff) | Full-screen touch POS terminal, scale weight keypad, cart checkout, cash & e-wallet payment, thermal receipt printer modal, customer queue caller. |
| **Customer** | `customer@test.com` | `Password123!` | [http://localhost:5173/shop](http://localhost:5173/shop) | Digital queue ticket dispenser, live meat cut price board, queue status display. |

---

## 🧪 Running Automated Tests & Linting

### Backend Tests & Verification
Run in repository root:
```powershell
# Run backend test suite (42 unit & integration tests)
npm test

# Run code linter
npm run lint

# Run automated verification (tests + linting combined)
npm run verify
```

### Frontend Tests & Build
Run in the `frontend` directory:
```powershell
cd frontend

# Run frontend tests
npm test

# Run code linter
npm run lint

# Build production distribution bundle
npm run build
```

---

## 🛠️ Troubleshooting & Common Setup Errors

### 1. `Cannot find module 'node:sqlite'`
- **Cause**: Your installed Node.js version is older than `v22.12.0`.
- **Fix**: Run `node -v`. If it is below v22.12.0, download and install Node.js v22.12+ or Node.js v24+ from [nodejs.org](https://nodejs.org/). Restart VS Code afterwards.

### 2. PowerShell: `File ... cannot be loaded because running scripts is disabled on this system`
- **Cause**: Windows PowerShell default execution policy blocks unsigned script execution.
- **Fix**: In VS Code terminal, run:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
  Then re-run your `npm` command.

### 3. Product list is empty or "Database table does not exist"
- **Cause**: Migrations and seeds have not been executed yet.
- **Fix**: In the root directory, run:
  ```powershell
  npm run db:migrate
  npm run db:seed
  ```

### 4. `Network Error` or `Failed to fetch` in the browser
- **Cause**: The backend API server is either not running or running on a different port.
- **Fix**:
  1. Confirm Terminal 1 is actively running `npm run dev` in the root folder and listening on `http://localhost:3000`.
  2. Test [http://localhost:3000/health](http://localhost:3000/health) in your browser.
  3. Ensure `frontend/.env` has `VITE_API_BASE_URL=http://localhost:3000/api/v1`.

### 5. Port `3000` or `5173` is already in use
- **Cause**: Another application or orphaned background Node process is using the port.
- **Fix (Windows PowerShell)**:
  ```powershell
  # Find process using port 3000
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  ```
  Or change `PORT=3001` in your root `.env` and update `VITE_API_BASE_URL` in `frontend/.env`.

---

## ⚖️ POS Store Rules & Retail Limits

The system enforces strict retail rules across both backend transactions and frontend cart checkout:

- **Minimum Order Amount**: ₱50.00 per transaction
- **Maximum Order Amount**: ₱50,000.00 per transaction
- **Daily Branch Capacity**: 500 orders/day per branch
- **Customer Daily Cap**: 10 orders/day per registered customer
- **Weight Bounds**: 0.05 kg (50g) to 100.0 kg per line item
- **Atomic Stock Checkout**: Stock deductions and payment logging occur inside an isolated SQLite transaction. Transactions automatically rollback if stock is insufficient.

---

## 📁 Project Directory Structure

```text
Automated-POS-System/
├── src/                     # Backend API source code
│   ├── app.js               # Express app configuration & middleware
│   ├── server.js            # Server bootstrap & graceful shutdown
│   ├── config/              # Environment schema (Zod) & POS constants
│   ├── controllers/         # HTTP request/response handlers
│   ├── db/                  # SQLite connection manager (node:sqlite)
│   ├── middleware/          # Auth JWT, RBAC guards, error handling
│   ├── repositories/        # SQL data queries & transactions
│   ├── routes/              # Express API route declarations
│   ├── services/            # Business logic & checkout transactions
│   └── utils/               # Order, receipt & queue number generators
├── tests/                   # Backend automated test suite (node:test)
├── scripts/                 # Database migration & seed runners
│   ├── migrations/          # DDL schema migrations (001_init_schema.sql)
│   └── seeds/               # Initial meat cuts, prices & accounts
├── docs/                    # Architecture & operational documentation
│   ├── ARCHITECTURE.md      # System design, layer diagram & RBAC matrix
│   ├── POS_RULES.md         # Operational business constraints
│   ├── API.md               # Frozen REST API contract specification
│   ├── QA_PLAN.md           # QA test plans & test matrices
│   ├── AGENT_HANDOFF.md     # Engineering status & progress
│   ├── PRIVACY_NOTICE.md    # Data privacy policy
│   └── TERMS_OF_SERVICE.md  # Terms of service
├── frontend/                # React 19 + Vite 8 SPA
│   ├── src/                 # Components, pages, hooks, contexts
│   │   ├── api/             # API client & backend connection
│   │   ├── components/      # Touch keypad, modals, receipt views
│   │   ├── contexts/        # Auth and Cart state providers
│   │   └── pages/           # Login, Staff POS, Owner, Shop views
│   ├── tests/               # Frontend logic & integration tests
│   ├── .env.example         # Frontend environment template
│   └── package.json         # Frontend dependencies & scripts
├── .env.example             # Backend environment template
├── .gitignore               # Ignored files (node_modules, data/, .env)
├── package.json             # Backend dependencies & scripts
└── README.md                # Project documentation & setup guide
```

---

## 📖 Additional Documentation

- [System Architecture & RBAC Matrix](docs/ARCHITECTURE.md)
- [POS Store Rules & Constraints](docs/POS_RULES.md)
- [REST API Specifications](docs/API.md)
- [Quality Assurance & Test Plan](docs/QA_PLAN.md)
- [Agent Handoff & Changelog](docs/AGENT_HANDOFF.md)
