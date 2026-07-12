# 🚛 TransitOps — Smart Fleet Operations Platform

A modern transport and fleet operations platform that lets organizations run
vehicles, drivers, trips, maintenance, fuel, expenses, compliance, and
AI-assisted dispatch from a single dashboard — with a rules-driven dispatch
workflow and a tamper-evident audit trail.

**Live app:** https://driver-dash-plus.lovable.app

![TransitOps landing page](https://driver-dash-plus.lovable.app/__l5e/assets-v1/39894860-be8a-47b0-831c-58107d9b2ba0/transitops-landing.png)

---

## Overview

TransitOps replaces spreadsheets and chat threads with a centralized operations
console. It enables teams to:

- Manage fleet and vehicles with full lifecycle status
- Maintain driver records, licenses, and availability
- Plan, validate, and dispatch trips against a rules engine
- Track maintenance schedules and service history
- Log fuel and operational expenses
- Analyze utilization, cost, and efficiency
- Keep a hash-chained, tamper-evident audit log for compliance
- Ask an AI Fleet Copilot questions about live, permission-scoped data

---

## Screenshots

### Operations dashboard
Real-time KPIs, recent activity, and module rollout status.

![Dashboard](https://driver-dash-plus.lovable.app/__l5e/assets-v1/39f32550-8028-498e-a7ca-a3ac0f1397d4/transitops-dashboard.png)

### Fleet registry
Search, filter, and manage vehicles with availability status.

![Vehicles](https://driver-dash-plus.lovable.app/__l5e/assets-v1/5647ff43-f1b0-4866-9330-80994792b603/transitops-vehicles.png)

### Role-based sign in
Email/password and Google sign-in, secured with role-based access control.

<img width="1918" height="988" alt="image" src="https://github.com/user-attachments/assets/1a3c0453-763d-4d65-b0e5-257c204a9235" />

---

## Key Features

### Authentication & Access
- Email/password and Google sign-in
- Role-based access control (admin, manager, dispatcher, driver, viewer)
- Roles stored in a dedicated table with a security-definer `has_role()` helper
- Protected routes and per-page role gating
- Row-Level Security (RLS) on every data table

### Fleet Management
- Vehicle registration and CRUD
- Availability & lifecycle status tracking
- Search and filters

### Driver Management
- Driver profiles and license tracking
- Driver availability
- Link drivers to user accounts for the Driver Portal

### Trip & Dispatch
- Trip planning with vehicle and driver assignment
- Availability-aware dispatch validation (checklist gate)
- Plain-English rationale for dispatch decisions
- Trip status workflow (scheduled → dispatched → in progress → completed)

### Maintenance
- Service records and preventive maintenance
- Service history and vehicle health tracking
- Automatic vehicle status transitions

### Fuel & Expenses
- Fuel logs and expense management
- Cost tracking with category breakdowns

### Reports & Analytics
- Fleet utilization and ROI
- Fuel efficiency and operational cost analysis
- Dashboard KPIs, charts, and CSV export

### AI Fleet Copilot
- Natural-language questions answered from live, RLS-scoped fleet data
- Powered by the Lovable AI Gateway (Google Gemini)

### Audit & Compliance
- Hash-chained audit log written by database triggers
- Client-side chain verification to detect tampering

---

## Business Rules

The platform enforces operational rules automatically, including:

- Unique vehicle registration numbers
- No dispatch for vehicles under maintenance or retired
- Driver license and availability validation
- Vehicle availability checks
- Cargo/capacity validation
- Automatic status updates during dispatch and trip completion

---

## Technology Stack

This project is built on the **Lovable** platform. The original Next.js /
Express / Prisma specification was mapped onto Lovable's integrated stack:

### Frontend
- **TanStack Start** (React 19, file-based routing, SSR)
- **TypeScript**
- **Tailwind CSS v4** (OKLCH design tokens)
- **shadcn/ui** components
- **TanStack Query** for data fetching
- **Recharts** for analytics
- **Vite 7** build tooling

### Backend (Lovable Cloud)
- **PostgreSQL** database
- Row-Level Security (RLS) for authorization
- Database migrations, functions, and triggers
- **TanStack server functions** (`createServerFn`) for app-internal server logic
- Managed authentication (email/password + Google OAuth)

### AI
- **Lovable AI Gateway** (Google Gemini) — no external key required

---

## Project Structure

```text
.
├── src/
│   ├── routes/                 # File-based routes (TanStack Start)
│   │   ├── __root.tsx          # App shell + head metadata
│   │   ├── index.tsx           # Landing page
│   │   ├── auth.tsx            # Sign in / sign up
│   │   └── _authenticated/     # Protected routes
│   │       ├── dashboard.tsx
│   │       ├── vehicles.tsx
│   │       ├── drivers.tsx
│   │       ├── trips.tsx
│   │       ├── maintenance.tsx
│   │       ├── fuel.tsx
│   │       ├── reports.tsx
│   │       ├── assistant.tsx   # AI Fleet Copilot
│   │       ├── audit.tsx       # Tamper-evident audit trail
│   │       └── portal.tsx      # Driver Portal
│   ├── components/             # UI + layout components
│   ├── lib/                    # auth, fleet, ops, audit, ai helpers
│   ├── integrations/supabase/  # Generated Cloud client & types
│   └── styles.css              # Design system (OKLCH tokens)
├── supabase/migrations/        # Database schema, RLS, triggers
├── docs/screenshots/           # Asset pointers for README images
└── README.md
```

---

## Data Model

Core tables (all protected with RLS):

- `profiles` — workspace members
- `user_roles` — role assignments (separate from profiles for security)
- `vehicles` — fleet registry
- `drivers` — driver records
- `trips` — trip & dispatch records
- `maintenance_logs` — service history
- `fuel_logs` — fuel entries
- `expenses` — operational costs
- `audit_logs` — hash-chained, tamper-evident event trail

---

## Running Locally

This is a Lovable project. Development, preview, and deployment are managed
through the Lovable editor — changes are reflected in the live preview
automatically.

For local development against a checkout:

```bash
bun install
bun run dev
```

The app runs on `http://localhost:8080`.

---

## Roles

| Role       | Access |
|------------|--------|
| Admin      | Full access to every module and settings |
| Manager    | Vehicles, drivers, reports, maintenance |
| Dispatcher | Create trips and run the dispatch workflow |
| Driver     | View assigned trips and submit logs (Driver Portal) |
| Viewer     | Read-only access to dashboards and reports |

> The first account created becomes the workspace administrator.

---

## Future Enhancements

- GPS tracking & live vehicle monitoring
- Route optimization
- Predictive maintenance
- OCR receipt processing & spreadsheet import
- Mobile application
- Multi-tenant support
- IoT integration

---

## License

Developed as part of the **TransitOps — Smart Fleet Operations Platform** for
educational and demonstration purposes.
