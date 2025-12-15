# Alfamart Retail POS System

A distributed Point of Sale (POS) system with separate Cashier and Admin applications.

## Project Structure

```
alfa-retail-pos/
├── cashier-pos/          # Local-first POS for store terminals
├── admin-dashboard/      # Cloud-first management dashboard
├── QUERYSCRIPTREFRENCE/  # SQL reference scripts
└── README.md             # This file
```

## Applications

### Alfamart POS (`cashier-pos/`)

Local-first Point of Sale system for store cashiers.

- **Port:** 3000
- **Database:** Local PostgreSQL (primary) + TiDB Cloud (sync)
- **Auth:** PIN-based local authentication
- **Features:** Product search, barcode scanning, cart management, multiple payment methods

```bash
cd cashier-pos
bun install
bun dev
```

### Alfamart Admin Dashboard (`admin-dashboard/`)

Cloud-first management dashboard for administrators.

- **Port:** 3001
- **Database:** TiDB Cloud only
- **Auth:** Supabase email/password
- **Features:** Sales analytics, branch performance, transaction history, employee management

```bash
cd admin-dashboard
bun install
bun dev
```

## Database Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| Local | PostgreSQL | Store transactions, products, inventory |
| Cloud | TiDB (MySQL) | Consolidated data from all branches |
| Auth | Supabase | User authentication and profiles |

## Getting Started

1. **Setup Environment Variables**
   - Copy `.env.example` to `.env` in both directories
   - Fill in your database credentials

2. **Setup Local Database (Cashier POS)**
   ```bash
   cd cashier-pos
   bun run scripts/setup-local-db.ts
   ```

3. **Run Applications**
   ```bash
   # Terminal 1 - Alfamart POS
   cd cashier-pos && bun dev

   # Terminal 2 - Alfamart Admin Dashboard
   cd admin-dashboard && bun dev
   ```

## Technologies

- **Framework:** Next.js 16 + React 19
- **Styling:** Tailwind CSS v4
- **Components:** Radix UI + Shadcn/ui
- **State:** Zustand
- **Animations:** Framer Motion
- **Database:** PostgreSQL, MySQL/TiDB, Supabase

---

© 2024 Alfamart Retail System
