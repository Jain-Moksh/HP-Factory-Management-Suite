# Project: NP-Frontend (Accounting & Inventory Management System)

This document provides a comprehensive overview of the website's architecture, logic, structure, and file mapping. It is designed to give a complete view of the system's inner workings.

---

## 🚀 1. Tech Stack
- **Frontend**: 
    - **Library**: React.js (Vite)
    - **Styling**: Tailwind CSS
    - **Icons**: Lucide React
    - **Communication**: Axios (REST API calls)
    - **Routing**: React Router DOM
- **Backend**: 
    - **Environment**: Node.js
    - **Framework**: Express.js
- **Database**: 
    - **System**: PostgreSQL
    - **Connection**: `pg` (node-postgres)
- **Deployment**: Local server execution via `start.bat`.

---

## 🏗️ 2. Project Architecture & Structure

### Root Directory
- `/client`: All frontend React source code.
- `/server`: All backend Node.js source code.
- `start.bat`: Convenience script to launch both client and server concurrently.

### Backend (`/server`)
The backend follows a Controller-Service-Query pattern for clean separation of concerns.
- `server.js`: entry point; starts the HTTP server.
- `app.js`: Configures middleware (CORS, JSON parsing) and mounts API routes.
- `/routes`: Maps URLs to controller functions (e.g., `billingRoutes.js`, `itemRoutes.js`, `reportRoutes.js`).
- `/controllers`: Extracts data from requests and sends responses.
- `/services`: Contains core business logic that spans multiple tables (e.g., the complex logic for updating stock during an invoice edit).
- `/queries`: SQL query templates. Uses parameterized queries to prevent SQL injection.
- `/utils`: Helper functions like `challanGenerator.js` (unique sequence logic) and `dateUtils.js`.
- `/config`: Database connection pool settings.
- `db.md`: The living schema document (SQL definitions).
- `api.md`: The API contract document (Endpoints and JSON shapes).

### Frontend (`/client`)
- `/src/pages`:
    - `/master`: Management of entities (Items, Parties, Jobbers, Transporters, Groups).
    - `/reports`: Data visualization and ledgers (Sales Report, Stock Detail, Job Work Analysis).
    - `CreateInvoice.jsx`: The "Billing" engine. Handles complex calculations for tax, discounts, and real-time stock validation.
    - `CreateJobWork.jsx`: The "Inward" engine. Used to receive finished goods from job workers.
    - `Dashboard.jsx`: Executive summary with "Low Stock" alerts.
- `/src/components`:
    - `BillingTable.jsx`: A spreadsheet-like interface for entering invoice items.
    - `PrintInvoice.jsx`: A dedicated component that generates a professional A4/Half-page printable bill.
    - `Sidebar.jsx`: The primary navigation hub.
- `/src/config.js`: Contains the `API_URL` configuration.

---

## 🧠 3. Core Logic & Working Principles

### A. Real-Time Stock Maintenance
Inventory is managed using a **Single Source of Truth** approach in the `items.stock` column.
- **Inward (Purchase/Job Work)**: When a Job Work entry is saved, the quantities are added to `items.stock`.
- **Outward (Billing/Invoice)**: When an invoice is saved, the quantities are subtracted from `items.stock`.
- **Atomic Transactions**: The system uses database transactions. If an invoice has 10 items and the 10th item fails to save, the stock changes for the previous 9 items are automatically rolled back.
- **Reverse-Logic on Edit/Delete**: 
    - To edit an invoice, the system first "undoes" the previous stock impact (adds back sold items), then applies the new impact.
    - This ensures stock levels are always accurate even if quantities or items are changed.

### B. Intelligent Challan Number Generation
The system implements a specific sequencing logic for document identification:
- **Format**: `[Prefix]<Sequence>/[Month]/[FY]`
- **Reset Rules**: The `<Sequence>` number resets to `1` at the start of every month.
- **Prefixes**: 
    - Billing: No prefix (e.g., `15/MAY/26-27`)
    - Purchase/Job Work: `P` prefix (e.g., `P04/MAY/26-27`)
- **Consistency**: Once a challan number is generated and saved, it is locked to that record. If the record is deleted, that sequence number is "burned" (never reused) to maintain audit integrity.
- **Dynamic Preview**: In the frontend, selecting a date triggers an API call to `/next-challan` which previews what the number will be.

### C. Stable Item Sequencing (`order_index`)
To ensure that items appear in the same order every time a bill is opened or printed:
- Every line item in `billing_items` and `purchase_items` has an `order_index`.
- During updates, the backend performs a "diff" and "upsert" based on this index to ensure existing items are updated and new ones are appended without reordering.

---

## 🗄️ 4. Database Schema (Referenced from db.md)

| Table | Description | Key Columns |
| :--- | :--- | :--- |
| `items` | Inventory Master | `name`, `rate`, `stock`, `unit`, `min_stock` |
| `clients` | Customer Master | `name`, `balance`, `city`, `shortform` |
| `billing` | Sales Headers | `challan_no`, `date`, `grand_total`, `client_id` |
| `billing_items` | Sales Line Items | `billing_id`, `item_id`, `quantity`, `rate`, `order_index` |
| `purchase` | Inward Headers | `jobber_id`, `challan_no`, `date` |
| `groups` | Entity Grouping | `name`, `description` |
| `group_members` | Polymorphic Join | `group_id`, `member_type` (client/jobber), `member_id` |

---

## 🔌 5. Key API Endpoints (Referenced from api.md)

### Master Data
- `GET /api/items?search=...` - Quick search for dropdowns.
- `POST /api/items` - Add new product.
- `GET /api/items/:id/transactions` - View a complete movement ledger for a specific item.

### Business Transactions
- `POST /api/billing` - Save new invoice (decrements stock).
- `PUT /api/billing/:id` - Update existing invoice.
- `DELETE /api/billing/:id` - Cancel invoice (restores stock).
- `GET /api/billing/next-challan` - Get next available sequence for a date.

### Business Intelligence (Reports)
- `/reports/party-stock-summary` - What is the total volume sold to Client X?
- `/reports/job-work-detail` - Detailed ledger of goods received from Jobber Y.
- `/reports/day-book` - What happened today across the entire business?

---

## 📂 6. File-to-Logic Mapping

- **Need to change how Challans are formatted?** Look at `server/utils/challanGenerator.js`.
- **Need to fix a calculation error in the Invoice?** Look at `client/src/pages/CreateInvoice.jsx` (Frontend) or `server/services/billingService.js` (Backend).
- **Need to add a new report?** Add a route in `server/routes/reportRoutes.js` and a page in `client/src/pages/reports/`.
- **Need to change the Database?** Update `server/db.md` (for docs) and run the SQL in your PG client.
- **Need to change the Print layout?** Modify `client/src/components/PrintInvoice.jsx`.

---

## 🛠️ 7. Development Workflows
- **Starting the app**: Run `start.bat`.
- **Adding a Master**: Use the boilerplate in `client/src/pages/master/`.
- **Debugging API**: Use the `GET /health` endpoint to check connectivity.
- **Validation**: Stock validation happens in the `billingController.js` before any DB commit.
