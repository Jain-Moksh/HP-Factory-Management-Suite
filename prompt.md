# NP-Frontend: Master AI Development Guide

This document is the **Single Source of Truth** for the NP-Frontend Accounting & Inventory Management System. It contains the complete architecture, database schema, API contracts, and core business logic required for any AI-driven development or code editing.

---

## 🏗️ 1. Project Architecture & Tech Stack

### Core Technologies
- **Frontend**: React.js (Vite), Tailwind CSS, Lucide Icons, Axios, React Router DOM.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (node-postgres / `pg`).
- **Development**: Local execution via `start.bat`.

### Folder Structure
- `/client`: React source code.
  - `/src/pages/master`: Management of Items, Clients, Jobbers, etc.
  - `/src/pages/reports`: Reporting dashboard and individual report pages.
  - `/src/components`: Reusable UI like `BillingTable`, `PrintInvoice`, `Sidebar`.
  - `/src/utils`: Logic for printing (`printUtils.js`) and API configuration.
- `/server`: Node.js/Express backend.
  - `/routes`: Endpoint definitions.
  - `/controllers`: Request handling and response mapping.
  - `/services`: Complex business logic (Stock updates, Transactions).
  - `/queries`: Raw SQL templates using parameterized queries.
  - `/utils`: Challan generation, date formatting, validation.
  - `/config`: Database connection pool settings.
  - `db.md` & `api.md`: Documentation (integrated into this file).

---

## 🗄️ 2. Database Schema (PostgreSQL)

### Master Tables
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    rate NUMERIC,
    stock NUMERIC,
    open_stock NUMERIC DEFAULT 0,
    conversion NUMERIC,
    unit TEXT,
    min_stock NUMERIC DEFAULT 0
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    street TEXT,
    city TEXT,
    shortform TEXT,
    balance NUMERIC,
    remark TEXT
);

CREATE TABLE jobbers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE transporters (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
```

### Transaction Tables
```sql
-- Sales / Billing
CREATE TABLE billing (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id),
    transporter_id INT REFERENCES transporters(id),
    date DATE,
    transport_charge NUMERIC,
    packing_charge NUMERIC,
    discount_percent NUMERIC,
    discount_amount NUMERIC,
    total_amount NUMERIC,
    short_remark TEXT,
    long_remark TEXT,
    grand_total NUMERIC,
    challan_no TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE billing_items (
    id SERIAL PRIMARY KEY,
    billing_id INT NOT NULL REFERENCES billing(id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES items(id),
    rate NUMERIC,
    discount_percent NUMERIC,
    discount_amount NUMERIC,
    unit TEXT,
    quantity NUMERIC,
    bundle NUMERIC,
    total_amount NUMERIC,
    order_index INT NOT NULL DEFAULT 0
);

-- Inward / Job Work (Purchase)
CREATE TABLE purchase (
    id SERIAL PRIMARY KEY,
    jobber_id INT NOT NULL REFERENCES jobbers(id),
    date DATE,
    remark TEXT,
    challan_no TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL REFERENCES purchase(id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES items(id),
    quantity NUMERIC,
    unit TEXT,
    order_index INT NOT NULL DEFAULT 0
);
```

### Grouping System
```sql
CREATE TYPE member_type_enum AS ENUM ('jobber', 'client');

CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    member_type member_type_enum NOT NULL,
    member_id INT NOT NULL, -- Refers to jobbers.id or clients.id
    UNIQUE(group_id, member_type, member_id)
);
```

---

## 🔌 3. API Contract (Base URL: `/api`)

### Master Data Endpoints
- `GET /items`: List/search items. Supports `?search=term`.
- `GET /items/:id/transactions`: Movement ledger for an item.
- `POST /items`: Create item.
- `DELETE /items/:id`: Secure delete (Requires password).
- `GET /clients`, `GET /jobbers`, `GET /transporters`: Standard CRUD.

### Billing & Purchase Endpoints
- `POST /billing`: Save invoice. Automatically decrements `items.stock`.
- `PUT /billing/:id`: Update invoice. Reverts old stock impact, applies new one.
- `GET /billing/next-challan?date=YYYY-MM-DD`: Preview next challan number.
- `POST /purchase`: Save inward stock. Automatically increments `items.stock`.
- `PUT /purchase/:id`: Update purchase. Reverts old stock impact, applies new one.

### Reporting Endpoints
- `GET /reports/party-stock-summary?client_id=X`: Total items billed to a client.
- `GET /reports/party-sales`: Aggregated sales revenue per client.
- `GET /reports/job-work-summary?jobber_id=X`: Total items received from a jobber.
- `GET /reports/day-book?date=YYYY-MM-DD`: Combined ledger of all daily activity.
- `GET /reports/detail-job-report`: Inward movement ordered by index for printing.
- `GET /reports/item-sold-summary`: Total sales velocity per item.

---

## 🧠 4. Core Business Logic & Rules

### A. Real-Time Stock Management
- **Single Source of Truth**: Inventory is stored in `items.stock`.
- **Atomic Operations**: All stock updates must happen inside a SQL Transaction.
- **Inverse Correction on Edit/Delete**: 
  - To **Edit**: (1) Reverse previous impact. (2) Apply new impact.
  - This ensures stock accuracy even if the user changes the item ID or quantity in an existing bill.

### B. Challan Number Sequencing
- **Format**: `<Sequence>/<MONTH>/<FY>` (e.g., `15/MAY/26-27`).
- **Prefixes**: Billing (None), Purchase (`P`).
- **Reset Logic**: Sequence resets to `1` every month.
- **Generation Rule**: The backend calculates the sequence using `MAX(sequence) + 1` for the month/FY. Frontend previews are for UI only.

### C. Stable Item Ordering (`order_index`)
- Both `billing_items` and `purchase_items` use `order_index`.
- During updates, the backend performs a "diff/upsert" using the DB `id` and `order_index` to preserve the user's intended order.

---

## 🎨 5. Responsive Printing Engine

### Capabilities
- **Dynamic Sizing**: Supports A4 (Full) and A5 (Half) paper sizes via `printSettings.js`.
- **CSS Isolation**: The `.print-container` class hides the main UI during `window.print()`.
- **Optimization**: Pure black text, bold headers, and minimal padding for Dot Matrix printers.

### File Mapping for Printing
- `client/src/constants/printSettings.js`: Paper configurations.
- `client/src/utils/printUtils.js`: Lifecycle management.
- `client/src/components/PrintInvoice.jsx`: Invoice template.
- `client/src/components/PrintDetailJobReport.jsx`: Report template.

---

## 🛠️ 6. AI Development Guidelines

### 1. Implementation Patterns
- **Queries**: Keep raw SQL in `/server/queries/`.
- **Controllers**: Thin controllers, business logic in `/server/services/`.
- **Components**: Functional React components with hooks. Use `MonthFilterFooter` for report date ranges.

### 2. Implementation Workflow for New Reports
1. **Backend**: Add SQL query, create service method, add route.
2. **Frontend**: Create report page, integrate filter, implement printing using `printUtils.js`.

### 3. Safety Rules
- **Transactions**: Always wrap multi-table modifications in `BEGIN/COMMIT`.
- **Passwords**: Deletions in master tables require a password check.
- **Validation**: Check stock availability in the backend before committing a sale.

---

## 📂 7. Key File Index

| Feature | Key Files |
| :--- | :--- |
| **Billing Logic** | `CreateInvoice.jsx`, `billingController.js`, `billingService.js` |
| **Stock Logic** | `itemsController.js`, `billingService.js`, `purchaseService.js` |
| **Challan Format** | `server/utils/challanGenerator.js` |
| **Global Styles** | `client/src/index.css` (Tailwind + Print Overrides) |
| **Constants** | `client/src/config.js`, `client/src/constants/printSettings.js` |
| **Reports** | `server/routes/reportRoutes.js`, `client/src/pages/reports/` |

---
*End of Master Guide.*
