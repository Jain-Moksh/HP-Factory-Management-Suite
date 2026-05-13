-- =========================
-- MASTER TABLES
-- =========================

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

-- Many-to-Many: jobbers ↔ items
CREATE TABLE jobber_items (
    id SERIAL PRIMARY KEY,
    jobber_id INT NOT NULL,
    item_id INT NOT NULL,
    
    FOREIGN KEY (jobber_id) REFERENCES jobbers(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- =========================
-- BILLING TABLES
-- =========================

CREATE TABLE billing (
    id SERIAL PRIMARY KEY,
    
    client_id INT NOT NULL,
    transporter_id INT,
    
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (transporter_id) REFERENCES transporters(id)
);

CREATE TABLE billing_items (
    id SERIAL PRIMARY KEY,
    
    billing_id INT NOT NULL,
    item_id INT NOT NULL,
    
    rate NUMERIC,
    discount_percent NUMERIC,
    discount_amount NUMERIC,
    
    unit TEXT,
    quantity NUMERIC,
    bundle NUMERIC,
    total_amount NUMERIC,
    order_index INT NOT NULL DEFAULT 0,

    FOREIGN KEY (billing_id) REFERENCES billing(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);

-- =========================
-- PURCHASE TABLES
-- =========================

CREATE TABLE purchase (
    id SERIAL PRIMARY KEY,
    
    jobber_id INT NOT NULL,
    date DATE,
    remark TEXT,
    challan_no TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (jobber_id) REFERENCES jobbers(id)
);

CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    
    purchase_id INT NOT NULL,
    item_id INT NOT NULL,
    
    quantity NUMERIC,
    unit TEXT,
    order_index INT NOT NULL DEFAULT 0,

    FOREIGN KEY (purchase_id) REFERENCES purchase(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id)
);


-- =========================
-- SEARCH INDEXES (Dropdown)
-- =========================

CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_jobbers_name ON jobbers(name);

-- =========================
-- FOREIGN KEY INDEXES
-- =========================

CREATE INDEX idx_billing_client ON billing(client_id);
CREATE INDEX idx_billing_transporter ON billing(transporter_id);

CREATE INDEX idx_billing_items_billing ON billing_items(billing_id);
CREATE INDEX idx_billing_items_item ON billing_items(item_id);

CREATE INDEX idx_purchase_jobber ON purchase(jobber_id);
CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);

CREATE INDEX idx_jobber_items_jobber ON jobber_items(jobber_id);
CREATE INDEX idx_jobber_items_item ON jobber_items(item_id);

CREATE INDEX idx_billing_date ON billing(date);
CREATE INDEX idx_purchase_date ON purchase(date);
CREATE INDEX idx_billing_client_date ON billing(client_id, date);

CREATE INDEX idx_group_members_group ON group_members(group_id);

CREATE INDEX idx_purchase_jobber_date ON purchase(jobber_id, date);
CREATE INDEX idx_purchase_items_item ON purchase_items(item_id);
CREATE INDEX idx_items_low_stock ON items(stock, min_stock);

-- =========================
-- GROUP SYSTEM TABLES
-- =========================

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
    group_id INT NOT NULL,
    member_type member_type_enum NOT NULL,
    member_id INT NOT NULL, -- Refers to jobbers.id or clients.id
    UNIQUE(group_id, member_type, member_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- =========================
-- SYSTEM TABLES
-- =========================

CREATE TABLE backup_settings (
    id SERIAL PRIMARY KEY,
    auto_backup_enabled BOOLEAN DEFAULT TRUE,
    auto_backup_path TEXT DEFAULT 'C:/NP-Backups/',
    auto_backup_interval INT DEFAULT 60,
    last_backup_time TIMESTAMP WITH TIME ZONE,
    last_backup_file TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Note: polymorphic relationship on member_id is validated in backend.
-- If member_type = 'jobber', member_id must exist in jobbers table.
-- If member_type = 'client', member_id must exist in clients table.

-- =============================================
-- DATABASE DATE PRECISION (TIMEZONES)
-- =============================================
-- The system configures the `node-postgres` driver to treat DATE OID 1082 as a raw string.
-- This prevents the driver from automatically converting UTC dates to local time, which often causes date-shifting (e.g., a bill saved on May 1st appearing as April 30th).
-- All dates are stored and retrieved as raw ISO-8601 string literals (`YYYY-MM-DD`).

-- =============================================
-- STOCK MAINTENANCE LOGIC
-- =============================================
-- The `items.stock` column is the SINGLE SOURCE OF TRUTH for current inventory.
-- It is NOT derived on the fly for the summary view.
-- Instead, it is updated in real-time during transactions:
-- 1. PURCHASE/JOB WORK: Increments `items.stock` by the quantity received.
-- 2. BILLING/INVOICE: Decrements `items.stock` by the quantity sold.
-- 3. UPDATES/DELETIONS: The system uses database transactions to reverse original stock changes before deleting records or applying new ones.
--    - Deleting an invoice adds quantities back to stock.
--    - Deleting a job work entry subtracts quantities back from stock.
-- 
-- For auditing purposes, a movement ledger can be generated by UNIONing 
-- `purchase_items` and `billing_items`.

-- =============================================
-- REPORTS MODULE LOGIC
-- =============================================
-- 1. PARTY WISE STOCK: Computes total quantity billed to a party using SUM(billing_items.quantity) grouped by item. Does NOT use items.stock.
-- 2. PARTY WISE STOCK DETAIL: Provides a granular transaction ledger for a specific client and item, fetching challan number, date, rate, and quantity from `billing` and `billing_items`. The ledger includes the unit rate for each transaction to assist in price tracking.
-- 3. PARTY WISE SALES: Aggregates client sales from `billing` and `billing_items` with date range support.
-- 4. GROUP SALES REPORT:
--    - Uses a polymorphic join on `group_members`.
--    - If `member_type` = 'client', joins with `clients` and `billing` for volume/amount.
--    - If `member_type` = 'jobber', resolves name (sales strictly from clients).
-- 5. JOB WORK ANALYSIS: Aggregates inward production volume (quantities) from `purchase` and `purchase_items` by jobber and item. Supports granular item-level transaction ledgers.
-- 6. DAY BOOK: Provides a combined daily ledger of all Billing and Purchase transactions via a UNION ALL strategy, allowing for a single chronological view of operations.
-- 7. DETAIL JOB REPORT:
--    - Displays inward stock movement from Job Work entries.
--    - Joins `purchase`, `purchase_items`, and `items`.
--    - Uses `purchase_items.order_index` to maintain the specific sequence of items as entered.
--    - Query:
--    SELECT p.id AS purchase_id, p.date, pi.quantity, pi.order_index, i.name as item_name 
--    FROM purchase p JOIN purchase_items pi ON p.id = pi.purchase_id JOIN items i ON i.id = pi.item_id 
--    WHERE p.date BETWEEN $1 AND $2 
--    ORDER BY p.date ASC, p.id ASC, pi.order_index ASC;
-- 8. JOB SUMMARY REPORT:
--    - Aggregates total quantities of items per jobber within a date range.
--    - Only includes jobbers with purchase activity in the selected period.
-- 9. ITEM SOLD SUMMARY:
--    - Aggregates total quantities sold per item across all clients for a specific period.
--    - Joins `billing`, `billing_items`, and `items`.
--    - Used for tracking sales velocity and high-moving inventory items.
-- 10. CHALLAN NUMBER LOGIC:
--    - Format: <sequence>/<MONTH>/<FY> (e.g., 6/APR/26-27).
--    - Financial Year: Starts April 1st, ends March 31st.
--    - Sequence: Resets every month. The sequence number is calculated by finding the MAX() numeric sequence from existing records in the same month and financial year (excluding the current record in case of edits).
--    - Consistency: Once a challan number is generated and saved, it remains fixed unless the month/FY changes during an edit.
--    - Generation (Create): Sequence is calculated during preview and recalculated during actual save to handle concurrency.
--    - Generation (Edit): The backend strictly evaluates date changes. If the month/FY changes, a new sequence is atomically generated. If it does not change, the original sequence is retained. Frontend inputs for challan_no are ignored.
-- 11. Stable Item Ordering:
--    - To prevent item shuffling during edits, both `billing_items` and `purchase_items` include an `order_index` column.
--    - The backend uses an UPSERT logic to edit items in place by their DB `id` while preserving their `order_index`. New items are appended with an incremented `order_index`.
--    - Queries fetch items `ORDER BY order_index ASC`.

-- =============================================
-- SYSTEM UTILITIES & DASHBOARDS
-- =============================================
-- 1. UTILITY DASHBOARD (`Utility.jsx`):
--    - Centralized hub for system tools and maintenance.
--    - Provides access to Backup, Restore, and planned Security modules.
-- 2. DASHBOARD:
--    - High-level overview of system health and low-stock alerts.
-- 3. MASTER LISTS:
--    - Individual management pages for Items, Clients, Jobbers, and Transporters.
-- 4. PLANNED MODULES (WIP):
--    - PAYMENT MODULE: Integrated tracking of party payments (Currently uses dummy data).
--    - SECURITY MODULE: Password management and access control (Placeholder in Utility).
--    - AUDIT SYSTEM: User activity logging (Placeholder in Utility).

-- =============================================
-- BACKUP & RESTORE SYSTEM
-- =============================================
-- 1. MANUAL BACKUP:
--    - Generates a full .sql dump using `pg_dump`.
--    - Streamed directly to the client for download.
-- 2. AUTOMATIC BACKUP:
--    - Centralized Trigger: Middleware in `app.js` detects successful POST/PUT/DELETE operations.
--    - Execution: Asynchronous background `pg_dump` with `--clean` flag to the path specified in `backup_settings`.
--    - Retention Policy: System keeps only the latest auto-backup file. Previous files recorded in `last_backup_file` are deleted upon successful creation of a new one.
-- 3. SELF-HEALING & RESILIENCE:
--    - Proactive Check (Startup): The system automatically triggers an auto-backup check when the server starts to ensure immediate recovery availability.
--    - Active Monitoring (Settings): Fetching backup settings triggers a physical disk check; if the last recorded file is missing, a fresh background backup is initiated.
--    - UI Feedback: During self-healing, the API returns status strings like "Creating fresh backup..." or "Backup in progress..." to inform the user.
-- 4. CONCURRENCY CONTROL:
--    - The system uses a memory lock (`isBackupRunning`) to prevent multiple backup or restore processes from overlapping. Subsequent requests return a `429` error until the active process completes.
-- 5. RESTORE LOGIC:
--    - Accepts a .sql or .backup file upload.
--    - Executes restoration using `psql` or `pg_restore`.
--    - Overwrites current database data (Schema + Data).

-- =============================================
-- DATA SANITIZATION (AUTOMATIC)
-- =============================================
-- The system uses a centralized backend utility (`dataSanitizer.js`) to recursively convert all string inputs to UPPERCASE before they are saved to the database.
-- This ensures consistent data entry, standardized reporting, and case-insensitive search reliability.
-- 
-- REFERENCE SQL (For manual cleanup):
-- Master Tables
-- UPDATE items SET name = UPPER(name), unit = UPPER(unit);
-- UPDATE clients SET name = UPPER(name), street = UPPER(street), city = UPPER(city), shortform = UPPER(shortform), remark = UPPER(remark);
-- UPDATE jobbers SET name = UPPER(name);
-- UPDATE transporters SET name = UPPER(name);

-- Billing Tables
-- UPDATE billing SET short_remark = UPPER(short_remark), long_remark = UPPER(long_remark), challan_no = UPPER(challan_no);
-- UPDATE billing_items SET unit = UPPER(unit);

-- Purchase Tables
-- UPDATE purchase SET remark = UPPER(remark), challan_no = UPPER(challan_no);
-- UPDATE purchase_items SET unit = UPPER(unit);

-- Group Tables
-- UPDATE groups SET name = UPPER(name), description = UPPER(description);

