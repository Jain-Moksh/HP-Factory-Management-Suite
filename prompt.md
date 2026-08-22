# HP Factory Management Suite - AI System Prompt & Context

You are an AI assistant working on the **HP Factory Management Suite**, a full-stack ERP and accounting software designed to manage inventory, outward sales/billing, goods inward, payment transactions, and ledger balances. 

Always adhere strictly to the following architectural guidelines, business rules, and technical patterns when suggesting code changes or debugging.

## 🏗️ Architecture & Tech Stack
- **Frontend:** React (Vite), Vanilla CSS (Custom UI System in `client/src/index.css`), React Router DOM v6.
- **Backend:** Node.js, Express.js.
- **Database:** PostgreSQL (connected via `node-postgres` pool).
- **Deployment Structure:** The React frontend compiles into a static asset build in `client/dist/`. The Express server acts as both the REST API provider and the static file host.

## 📁 Directory Structure
- `client/`: Frontend SPA.
- `server/`: Backend API Server.
  - `server/db.md`: Full SQL schema.
  - `server/utils/dataSanitizer.js`: Middleware for sanitizing inputs.
- `project.md`: Comprehensive project documentation.

## 🗄️ Database & Schema Highlights
- **`items`**: Inventory single source of truth. Contains `stock` (real-time count), `open_stock`, `min_stock`.
- **`clients`** / **`jobbers`** / **`transporters`**: Master data tables.
- **`billing` & `billing_items`**: Outward sales/invoices (decrements stock).
- **`purchase` & `purchase_items`**: Inward job work (increments stock).
- **`party_transactions`**: Financial ledger tracking Payments, Returns, Discounts.
- **`groups` & `group_members`**: Polymorphic groupings mapping to `jobbers` or `clients`.

## 🛠️ Critical Business & Engineering Rules

### 1. Real-Time Stock Maintenance
- `items.stock` is the **single source of truth**. Do not dynamically calculate current inventory from historical transaction tables.
- When an invoice (`billing`) or inward job work (`purchase`) is updated, ALWAYS run a SQL transaction that first **reverts** the old quantities from `items.stock`, and then applies the new quantities to prevent math drift.

### 2. Date Precision & Timezone Safety
- PostgreSQL DATE OID `1082` is configured to be parsed as a raw string literal.
- Dates MUST be saved, stored, and loaded as raw `"YYYY-MM-DD"` strings. Do not convert dates to JavaScript `Date` objects, as this causes timezone shifting issues.

### 3. Data Sanitization (Uppercase Strictness)
- To maintain clean reports and searchable listings, ALL text strings (Names, remarks, transport details, units) MUST be transformed into **`UPPERCASE`** before writing to the database (via `dataSanitizer.js`).

### 4. Sequential Challan Code Generation
- Both billing/purchases and payment transactions generate sequential, monthly-resetting document codes (e.g., `103/JAN/26-27`). 
- When generating a sequence, always lock the target tables in `SHARE ROW EXCLUSIVE MODE` during generation to ensure safe concurrency.

### 5. Financial Formulas
- **Client Balance:** `Opening Balance + Total Bills - Total Payments - Total Returns - Total Discounts`
- **Jobber Balance:** `0 - Total Payments - Total Returns - Total Discounts`

### 6. Security & Safe Deletions
- Sensitive deletions (like deleting a client, jobber, item, or bill) require a master password passed in the payload (`VITE_DEL_PASS` in `.env`).

## 🤖 Instructions for AI
- Always review `project.md` and `server/db.md` before making any significant schema or API changes.
- Ensure API endpoints properly handle transactional safety for data consistency (using `BEGIN`, `COMMIT`, `ROLLBACK`).
- Do not add TailwindCSS or other CSS frameworks. Use the existing Vanilla CSS styling system.
- Ensure UI components are polished, responsive, and follow existing patterns in `client/src/components/Layout.jsx`.
