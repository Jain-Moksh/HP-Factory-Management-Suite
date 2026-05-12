# NP-Frontend: Master AI Development Guide

This document is the **Single Source of Truth** for the NP-Frontend Accounting & Inventory Management System. It contains the complete architecture, database schema, API contracts, and core business logic required for any AI-driven development or code editing.

---

## 🏗️ 1. Project Architecture & Tech Stack

### Core Technologies
- **Frontend**: React.js (Vite), Tailwind CSS, Lucide Icons, Axios, React Router DOM.
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL (node-postgres / `pg`).
- **Development**: Local execution via `start.bat`.
- **Production**: The backend serves the compiled React `dist` folder as static assets via a wildcard route (`*`) in `app.js`.

### Folder Structure
- `/client`: React source code.
  - `/src/pages/master`: Management of Items, Clients, Jobbers, etc.
  - `/src/pages/reports`: Reporting dashboard and individual report pages.
  - `/src/pages`: Transactional and dashboard pages (`CreateInvoice`, `CreateJobWork`, `CreatePayment`, `Dashboard`, `DayBook`, `ItemStockDetails`, `JobWork`, `OrderSummary`, `Payment`, `StockSummary`, `Utility`).
  - `/src/pages/utility`: Specialized system tools (`BackupManager`, `RestoreManager`).
  - `/src/components`: Reusable UI like `BillingTable`, `PrintInvoice`, `Sidebar`, `MonthFilterFooter`, `PrintCopiesModal`, `DeleteModal`, `WarningModal`.
  - `/src/utils`: Logic for printing (`printUtils.js`) and API configuration.
  - `client/src/config.js`: Environment-based API base URL configuration (uses `VITE_API_URL`).
- `client/.env`: Defines the API URL and the `VITE_DEL_PASS` master password.
- `/server`: Node.js/Express backend.
  - `/routes`: Endpoint definitions.
  - `/controllers`: Request handling and response mapping.
  - `/services`: Complex business logic (Stock updates, Transactions).
  - `/queries`: Raw SQL templates using parameterized queries.
  - `/utils`: Challan generation, date formatting, validation.
  - `/config`: Database connection pool settings.
  - `/uploads/backups`: Storage for manual/auto backup files.
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

-- System Configurations
CREATE TABLE backup_settings (
    id SERIAL PRIMARY KEY,
    auto_backup_enabled BOOLEAN DEFAULT TRUE,
    auto_backup_path TEXT DEFAULT 'C:/NP-Backups/',
    last_backup_time TIMESTAMP WITH TIME ZONE,
    last_backup_file TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 3. API Contract (Base URL: `/api`)

### Master Data Endpoints
- `GET /items`: List/search items. Supports `?search=term`.
- `GET /items/:id/transactions`: Movement ledger for an item. Includes both Inward (Purchase) and Outward (Billing) transactions.
- `POST /items`: Create item.
- `DELETE /items/:id`: Secure delete (Requires password).
- `GET /clients`, `GET /jobbers`, `GET /transporters`: Standard CRUD.
- `POST /jobbers`: Create jobber with optional `item_ids`.

### Billing & Purchase Endpoints
- `POST /billing`: Save invoice. Automatically decrements `items.stock`.
- `PUT /billing/:id`: Update invoice. Reverts old stock impact, applies new one.
- `GET /billing/next-challan`: Preview next challan number. Supports `?date=YYYY-MM-DD` and `?billing_id=X` (for edits).
- `POST /purchase`: Save inward stock. Automatically increments `items.stock`.
- `PUT /purchase/:id`: Update purchase. Reverts old stock impact, applies new one.
- `DELETE /purchase/:id`: Secure delete (Requires password).

- `GET /api/backup/manual`: Download full DB backup.
- `GET /api/backup/status`: Fetch latest backup info.
- `PUT /api/backup/settings`: Update auto-backup configuration.
- `POST /api/backup/restore`: Overwrite system from file.
- `GET /utility`: System tools dashboard. Includes placeholders for Password Manager and System Audit (Coming Soon).

### Reporting Endpoints
- `GET /reports/party-stock-summary`: Total items billed to a client. Params: `client_id` (req), `from`, `to` (opt).
- `GET /reports/party-stock-detail`: Granular transaction ledger. Params: `client_id`, `item_id` (req), `from`, `to` (opt).
- `GET /reports/party-sales`: Aggregated sales revenue per client. Params: `client_id`, `from`, `to` (opt).
- `GET /reports/job-work-summary`: Total items received from a jobber. Params: `jobber_id` (req), `from`, `to` (opt).
- `GET /reports/day-book?date=YYYY-MM-DD`: Combined ledger of all daily activity.
- `GET /reports/detail-job-report`: Inward movement ordered by index for printing. Params: `startDate`, `endDate`.
- `GET /reports/item-sold-summary`: Total sales velocity per item. Params: `from`, `to`.
- `GET /reports/job-summary`: Aggregated production by jobber and item. Params: `from`, `to`.

---

## 🧠 4. Core Business Logic & Rules

### A. Real-Time Stock Management
- **Single Source of Truth**: Inventory is stored in `items.stock`.
- **Atomic Operations**: All stock updates must happen inside a SQL Transaction.
- **Inverse Correction on Edit/Delete**: 
  - To **Edit**: (1) Reverse previous impact. (2) Apply new impact.
  - This ensures stock accuracy even if the user changes the item ID or quantity in an existing bill.
- **Soft Validation**: The frontend provides warnings if a transaction results in negative stock or falls below minimum stock levels, but allows the user to proceed. The backend performs the update atomically without hard quantity checks.

### B. Challan Number Sequencing
- **Format**: `<Sequence>/<MONTH>/<FY>` (e.g., `15/MAY/26-27`).
- **Prefixes**: Billing (None), Purchase (`P`).
- **Reset Logic**: Sequence resets to `1` every month.
- **Generation Rule**: The backend calculates the sequence using `MAX(sequence) + 1` for the month/FY. Frontend previews are for UI only.

### C. Stable Item Ordering (`order_index`)
- Both `billing_items` and `purchase_items` use `order_index`.
- During updates, the backend performs a "diff/upsert" using the DB `id` and `order_index` to preserve the user's intended order.

### D. Jobber-Item Assignment Validation
- Items must be assigned to a Jobber in the Master Database (`jobber_items` table).
- During Job Work (Purchase) entry, the frontend validates if the selected item is assigned to the selected jobber.
- If not assigned, a warning is shown, but the user can choose to proceed (creating a soft-link for that transaction).

### E. Automatic Data Sanitization (UPPERCASE)
- **Centralized Utility**: The backend uses a recursive `dataSanitizer.js` utility to convert all string inputs to uppercase before database persistence.
- **Scope**: This applies to all Master data (Names, Units, Remarks) and Transactional data (Remarks, Challan Numbers).
- **Consistency**: Ensures searchability and standardized reporting across the entire system.

### F. Backup & Restore System
- **Centralized Trigger**: Backend middleware intercepts successful `POST/PUT/DELETE` to trigger a background auto-backup.
- **Execution**: Asynchronous background `pg_dump` with `--clean` flag (includes DROP TABLE commands for cleaner restoration).
- **Storage Provisioning**: The system automatically creates the backup directory (e.g., `C:/NP-Backups/`) if it does not exist on the file system.
- **Retention**: Only the latest auto-backup is kept; previous files are deleted to optimize storage.
- **Self-Healing**: If auto-backup is enabled but the last backup file is missing from disk, the system automatically triggers a new backup in the background.
- **Concurrency Control**: A global memory lock (`isBackupRunning`) prevents multiple backup or restore operations from running simultaneously, returning `429` errors for overlapping requests.
- **Manual Backups**: Never deleted automatically; streamed directly to the client.
- **Restore Safety**: High-priority confirmation required; restores overwrite the entire database.

### G. Database Date Precision & Timezones
- **DATE OID Fix**: To prevent `node-postgres` from shifting dates due to timezone offsets, the system implements a custom type parser for PostgreSQL OID `1082` (DATE).
- **Behavior**: All DATE values are retrieved as raw ISO string literals (`YYYY-MM-DD`) without any local time conversions. This ensures the date saved in an invoice or job work entry is exactly what is retrieved.

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
- `client/src/components/PrintDetailJobReport.jsx`: Detail Job Report template.
- `client/src/components/PrintPartySalesReport.jsx`: Party Sales template.
- `client/src/components/PrintItemSoldSummary.jsx`: Item Sold Summary template.
- `client/src/components/PrintJobSummaryReport.jsx`: Job Summary template.

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
- **Passwords**: Deletions in master tables require a password check (configured via `VITE_DEL_PASS` in the frontend and `del_pass` in the backend).
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
| **Payment (WIP)** | `Payment.jsx`, `CreatePayment.jsx`, `PaymentTable.jsx` |
| **Utility & Backup** | `pages/Utility.jsx`, `pages/utility/BackupManager.jsx`, `pages/utility/RestoreManager.jsx`, `backupController.js`, `backupService.js` |

---
*End of Master Guide.*
