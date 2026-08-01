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
    
    adjustment_percent NUMERIC,
    adjustment_amount NUMERIC,
    
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

CREATE INDEX idx_billing_date ON billing(date);
CREATE INDEX idx_purchase_date ON purchase(date);
CREATE INDEX idx_billing_client_date ON billing(client_id, date);

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

CREATE INDEX idx_group_members_group ON group_members(group_id);

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
-- It is updated in real-time during transactions via SQL Transactions:
-- 1. PURCHASE: Increments `items.stock`.
-- 2. BILLING: Decrements `items.stock`.
-- 3. EDITS/DELETIONS: Stock is automatically reversed (using quantities from existing items) before applying new changes or deleting records.
-- 4. MASTER DATA EDITS: If 'open_stock' is changed via an item update, the system automatically calculates a delta adjustment and applies it to 'items.stock'.

-- =============================================
-- REPORTS MODULE LOGIC
-- =============================================
-- 1. PARTY WISE STOCK SUMMARY: Aggregates total quantity billed to a client using SUM(quantity) from `billing_items`.
-- 2. PARTY WISE STOCK DETAIL: Granular ledger for a client-item pair, ordered by date ASC.
-- 3. PARTY WISE SALES: Aggregated revenue and quantity per client within a date range.
-- 4. GROUP SALES: Aggregates sales based on group membership (polymorphic join on jobbers/clients).
-- 5. GROUP SALES SUMMARY: Revenue per client within a specific group.
-- 6. GROUP SALES PRINT: Detailed transactions for all clients in a group, pre-aggregated by client for printing.
-- 7. JOB WORK ANALYSIS: Aggregates production volume (quantities) from job work entries.
-- 8. DAY BOOK: Combined daily ledger of all activity (UNION ALL of Billing and Purchase).
-- 9. DETAIL JOB REPORT: Inward movement ordered by date, purchase_id, and order_index for printing.
-- 10. JOB SUMMARY REPORT: Aggregates production by jobber and item for a period.
-- 11. ITEM SOLD SUMMARY: Total sales velocity per item.
-- 12. CHALLAN GENERATION: Format <seq>/<MONTH>/<FY>. Resets monthly. Transactionally safe using SHARE ROW EXCLUSIVE MODE locks.
-- 13. STABLE ITEM ORDERING: Both Billing and Purchase items use `order_index` to maintain the user's intended sequence during edits and reports.

-- =============================================
-- BACKUP & RESTORE SYSTEM
-- =============================================
-- 1. MANUAL BACKUP: pg_dump streamed to client.
-- 2. AUTOMATIC BACKUP: Triggered by middleware on successful mutations. Path/Interval defined in `backup_settings`.
-- 3. SELF-HEALING: Triggers background auto-backup on server startup and during settings fetch if files are missing on disk.
-- 4. CONCURRENCY: Uses `isBackupRunning` lock to prevent overlapping backup/restore operations.

-- =============================================
-- DATA SANITIZATION
-- =============================================
-- The system automatically converts all string inputs (Names, Remarks, Units, Challan No) to UPPERCASE via `dataSanitizer.js` before persistence.
