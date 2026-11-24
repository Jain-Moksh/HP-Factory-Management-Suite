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
    min_stock NUMERIC DEFAULT 0,
    packing TEXT DEFAULT ''
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
-- PARTY TRANSACTIONS TABLES
-- =========================

CREATE TYPE transaction_type_enum AS ENUM ('PAYMENT', 'RETURN', 'DISCOUNT');
CREATE TYPE party_type_enum AS ENUM ('CLIENT', 'JOBBER');

CREATE TABLE party_transactions (
    id SERIAL PRIMARY KEY,
    party_type party_type_enum NOT NULL,
    party_id INT NOT NULL,
    transaction_type transaction_type_enum NOT NULL,
    date DATE NOT NULL,
    challan_no TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_mode TEXT CHECK (payment_mode IN ('BANK', 'CASH') OR payment_mode IS NULL),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(transaction_type, challan_no)
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

CREATE INDEX idx_party_tx_party ON party_transactions(party_type, party_id);
CREATE INDEX idx_party_tx_sequence ON party_transactions(transaction_type, date);

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

-- =========================
-- PRICE LIST SYSTEM TABLES
-- =========================

CREATE TABLE price_lists (
    id INT PRIMARY KEY CHECK (id = 1),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO price_lists (id, date) VALUES (1, CURRENT_DATE) ON CONFLICT (id) DO NOTHING;

CREATE TABLE price_list_categories (
    id SERIAL PRIMARY KEY,
    price_list_id INT NOT NULL DEFAULT 1 REFERENCES price_lists(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    display_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (price_list_id, category_name)
);

CREATE TABLE price_list_items (
    id SERIAL PRIMARY KEY,
    price_list_category_id INT NOT NULL REFERENCES price_list_categories(id) ON DELETE CASCADE,
    item_id INT NOT NULL UNIQUE REFERENCES items(id) ON DELETE CASCADE,
    display_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_list_categories_list ON price_list_categories(price_list_id);
CREATE INDEX idx_price_list_items_category ON price_list_items(price_list_category_id);

-- =========================
-- DUPLICATE SAVE PROTECTION
-- =========================
-- Each invoice / job work form sends a random request_id with its first save.
-- A repeated save with the same id (double-click, retry) returns the existing record instead of creating another.
-- IF NOT EXISTS keeps these safe to re-run on every startup.

ALTER TABLE billing ADD COLUMN IF NOT EXISTS request_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_request_id ON billing(request_id);
ALTER TABLE purchase ADD COLUMN IF NOT EXISTS request_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchase_request_id ON purchase(request_id);
-- Payments: single entries store the form's request_id, bulk entries store <request_id>#<row number>
ALTER TABLE party_transactions ADD COLUMN IF NOT EXISTS request_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_party_tx_request_id ON party_transactions(request_id);
ALTER TABLE party_transactions ADD COLUMN IF NOT EXISTS entries JSONB;
ALTER TABLE party_transactions DROP CONSTRAINT IF EXISTS party_transactions_payment_mode_check;
ALTER TABLE party_transactions ADD CONSTRAINT party_transactions_payment_mode_check CHECK (payment_mode IN ('BANK', 'CASH', 'MIXED') OR payment_mode IS NULL);

-- =========================
-- UNIQUE MASTER NAMES
-- =========================
-- Names are unique ignoring case and surrounding spaces (masterService checks first and gives a clear message).

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_name_unique ON items (UPPER(TRIM(name)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_name_unique ON clients (UPPER(TRIM(name)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobbers_name_unique ON jobbers (UPPER(TRIM(name)));
CREATE UNIQUE INDEX IF NOT EXISTS idx_transporters_name_unique ON transporters (UPPER(TRIM(name)));
-- groupService checks first and gives a clear message. If an older database already has two groups
-- with the same name, this index is skipped (logged at startup) until one of them is renamed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_groups_name_unique ON groups (UPPER(TRIM(name)));

-- =========================
-- AUDIT & ARCHIVE TABLES
-- =========================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    module TEXT NOT NULL,          -- BILLING, JOB_WORK, PAYMENT, ITEM, PARTY, JOBBER, TRANSPORTER, GROUP, PRICE_LIST, SYSTEM
    action TEXT NOT NULL,          -- CREATE, UPDATE, DELETE, RESTORE
    record_id INT,
    reference TEXT,                -- Challan no. or record name
    summary TEXT,
    details JSONB,                 -- { before, after, changes } snapshots
    device_name TEXT,              -- Name the device registered for itself (X-Device-Name header)
    hostname TEXT,                 -- Network computer name resolved from the IP
    ip_address TEXT,
    os TEXT,
    browser TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_module ON audit_logs(module, created_at);

CREATE TABLE archived_records (
    id SERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,     -- Same values as audit_logs.module
    original_id INT NOT NULL,
    reference TEXT,
    party_name TEXT,
    record_date DATE,
    amount NUMERIC,
    data JSONB NOT NULL,           -- Full record snapshot including line items
    device_name TEXT,
    hostname TEXT,
    ip_address TEXT,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_archived_records_entity ON archived_records(entity_type, archived_at);

-- One row for every change to items.stock, written by the trigger trg_items_stock_movement
-- (installed by utils/stockMovementSetup.js, since a function body can't live in this file).
-- No foreign key to items: the history must survive an item being deleted.
CREATE TABLE stock_movements (
    id BIGSERIAL PRIMARY KEY,
    item_id INT NOT NULL,
    item_name TEXT,
    unit TEXT,
    old_stock NUMERIC,             -- NULL when the item was created
    new_stock NUMERIC,             -- NULL when the item was deleted
    change NUMERIC NOT NULL,       -- new_stock - old_stock (+ in, - out)
    source TEXT NOT NULL,          -- BILL, JOB_WORK, ITEM_MASTER, RESTORE, DIRECT_DB (changed outside the app)
    action TEXT,                   -- CREATE, UPDATE, DELETE, RESTORE
    reference_id INT,              -- billing.id / purchase.id / items.id
    reference TEXT,                -- Challan no or item name
    note TEXT,
    device_name TEXT,
    hostname TEXT,
    ip_address TEXT,
    db_user TEXT,
    db_client_addr TEXT,
    application_name TEXT,
    txid BIGINT,                   -- Rows from the same save share this
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_created ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_item ON stock_movements(item_id, created_at);
CREATE INDEX idx_stock_movements_source ON stock_movements(source, created_at);

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
--    Deleted bills, job work and payments are moved into `archived_records` (full JSON snapshot), so they never count in stock, ledgers or reports.
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
-- AUDIT LOG & ARCHIVE
-- =============================================
-- 1. Every data-changing action (create/update/delete of bills, job work, payments, masters, groups, price list, backup settings, restore)
--    writes one row to `audit_logs` inside the same transaction as the change, with the device name, hostname, IP, OS and browser.
-- 2. Deletes are archived: the record is removed from its live table (stock reversed as before) and its full snapshot is kept in `archived_records`.
-- 3. Logins and read-only requests are not logged.
-- 4. STOCK MOVEMENTS: a trigger on `items` writes a `stock_movements` row for every change to `stock`, whatever made it
--    (bill, job work, item master, a script, or a manual SQL edit). The app tags its changes by calling
--    set_config('app.stock_ctx', <json>, true) inside the transaction. Untagged changes are recorded as DIRECT_DB.
--    A restore replaces the history with the backup's, then adds RESTORE rows for every item whose stock changed.

-- =============================================
-- DATA SANITIZATION
-- =============================================
-- The system automatically converts all string inputs (Names, Remarks, Units, Challan No) to UPPERCASE via `dataSanitizer.js` before persistence.
