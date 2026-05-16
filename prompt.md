# Project: HP Accounting Software (Single Source of Truth)

## 🏗️ Architecture & Tech Stack
- **Frontend**: React (Vite), Vanilla CSS (Custom UI System), **React Router DOM** (Navigation).
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL (node-postgres).
- **Navigation**: High-fidelity navigation using `react-router-dom`. The main layout (`Layout.jsx`) manages a persistent `Sidebar` and a dynamic `Header`. Pages use `useOutletContext` to update header titles and actions dynamically.
- **Production**: Frontend is served as a static build from the `client/dist` directory by the Express server.

## 📁 Key Folder Structure
- `/client/src/pages`: Page components (Dashboard, CreateInvoice, etc.).
- `/client/src/pages/master`: Master data (Items, Clients, Jobbers, etc.).
- `/client/src/pages/reports`: Reporting modules (GroupSalesReport, DayBook, etc.).
- `/client/src/components/UI`: Reusable components (Button, Modal, Card, etc.).
- `/server/routes`: Express API routes.
- `/server/queries`: Centralized SQL queries.
- `/server/services`: Business logic and transactions.

## 🗄️ Core Database Schema (PostgreSQL)
- **items**: `id, name (unique), rate, stock, open_stock, conversion, unit, min_stock`.
- **clients**: `id, name, street, city, shortform, balance, remark`.
- **jobbers**: `id, name`. (Item assignments removed).
- **transporters**: `id, name`.
- **billing**: `id, client_id, transporter_id, date, transport_charge, packing_charge, discount_percent, discount_amount, total_amount, short_remark, long_remark, grand_total, challan_no (unique)`.
- **billing_items**: `id, billing_id, item_id, rate, discount_percent, discount_amount, unit, quantity, bundle, total_amount, order_index`.
- **purchase**: `id, jobber_id, date, remark, challan_no (unique)`.
- **purchase_items**: `id, purchase_id, item_id, quantity, unit, order_index`.
- **groups** & **group_members**: Polymorphic groupings of jobbers and clients.
- **backup_settings**: `id, auto_backup_enabled, auto_backup_path, auto_backup_interval, last_backup_time, last_backup_file`.

## 🔌 API Contract (Selected)
- **Master Data**: `GET/POST/PUT/DELETE` for `/items`, `/clients`, `/jobbers`, `/transporters`.
- **Transactions**:
  - `POST /billing`: Create invoice (Atomic stock decrement + Challan generation).
  - `POST /purchase`: Create job work (Atomic stock increment + Challan generation).
  - `GET /billing/next-challan?date=...&id=...`: Preview next available challan number.
- **Utilities**:
  - `GET /backup/manual`: Download full DB dump.
  - `GET /backup/settings`: Fetch/Auto-trigger self-healing backup check.
- **Reports**:
  - `/reports/group-sales-print`: Nested billing data per party for group reports.
  - `/reports/detail-job-report`: Inward movement ordered by date and `order_index`.
  - `/reports/item-sold-summary`: Sales velocity tracking.

## 🛠️ Core Business Rules
1. **Stock Maintenance**: `items.stock` is updated in real-time via SQL transactions. Edits/Deletions trigger automatic stock reversals.
2. **Data Sanitization**: All string inputs converted to `UPPERCASE` via `dataSanitizer.js` before persistence.
3. **Challan Numbers**: Generated as `<seq>/<MONTH>/<FY>`. Sequences reset monthly. Edits preserve original sequences unless month/FY changes.
4. **Stable Ordering**: `order_index` in transaction items ensures sequence preservation during edits and reporting.
5. **Precision**: 
   - Dates (OID 1082) treated as raw strings to avoid timezone shifting.
   - Decimals: Formatted to exactly 2 decimal places in financial reports.
6. **Security**: Sensitive deletions require a master password (`VITE_DEL_PASS`).

## 📄 Documentation Reference
- `server/api.md`: Detailed API structures.
- `server/db.md`: Full SQL schema and report query logic.
- `client/src/components/PrintInvoice.jsx`: Invoice print template.
- `client/src/components/PrintGroupPartySalesReport.jsx`: Multi-page group report template.
