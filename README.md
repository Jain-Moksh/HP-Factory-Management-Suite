# HP Accounting Software (Single Source of Truth)

## 🏗️ Architecture & Tech Stack
- **Frontend**: React (Vite), Vanilla CSS (Custom UI System), React Router DOM (Navigation).
- **Backend**: Node.js, Express.
- **Database**: PostgreSQL (node-postgres).
- **Navigation**: High-fidelity navigation using `react-router-dom`. The main layout (`Layout.jsx`) manages a persistent `Sidebar` and a dynamic `Header`. Pages use `useOutletContext` to update header titles and actions dynamically.
- **Production**: Frontend is served as a static build from the `client/dist` directory by the Express server.
- **Server Startup**: `start.bat` dynamically fetches the machine's local IP address and opens the frontend in the default browser on the local network.
- **Database Initialization**: The Node server auto-creates the database if missing and automatically executes `server/db.md` to initialize all tables on startup.

## 🗄️ Core Database Schema (PostgreSQL)
- **items**: `id, name (unique), rate, stock, open_stock, conversion, unit, min_stock`.
- **clients**: `id, name, street, city, shortform, balance, remark`.
- **jobbers**: `id, name`.
- **transporters**: `id, name`.
- **billing**: Invoices, automatically decrements item stock.
- **billing_items**: Invoice items.
- **purchase**: Job work received, automatically increments item stock.
- **purchase_items**: Job work items.
- **groups** & **group_members**: Polymorphic groupings of jobbers and clients.
- **backup_settings**: Auto-backup configuration.

## 🛠️ Core Business Rules
1. **Stock Maintenance**: `items.stock` is updated in real-time via SQL transactions.
2. **Data Sanitization**: All string inputs converted to `UPPERCASE` via `dataSanitizer.js` before persistence.
3. **Challan Numbers**: Generated as `<seq>/<MONTH>/<FY>`. Sequences reset monthly.
4. **Precision**: Dates (OID 1082) treated as raw strings to avoid timezone shifting. Decimals formatted to exactly 2 decimal places in financial reports.
5. **Security**: Sensitive deletions require a master password (`VITE_DEL_PASS`).

## 📄 Documentation Reference
- `server/api.md`: Detailed API structures.
- `server/db.md`: Full SQL schema and report query logic.
- `prompt.md`: Project summary and AI prompt context.

## 🚀 Running Locally
### Prerequisites
- Node.js installed
- PostgreSQL installed and running on port 5432

### Setup
1. Clone the repository.
2. Run `npm install` in both `client` and `server` directories.
3. Create a `.env` file in the `server` directory with your database credentials.
4. Run `npm run dev` in the `client` directory to start the frontend.
5. Run `node server.js` (or `node app.js`) in the `server` directory to start the backend.

Alternatively, use `start.bat` on Windows to build and start the production server locally.
