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

-- Note: polymorphic relationship on member_id is validated in backend.
-- If member_type = 'jobber', member_id must exist in jobbers table.
-- If member_type = 'client', member_id must exist in clients table.
-- =========================
-- SEQUENCES TABLE
-- =========================

CREATE TABLE challan_sequences (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'billing' or 'purchase'
    month INT NOT NULL,
    financial_year TEXT NOT NULL,
    last_number INT NOT NULL DEFAULT 0,
    UNIQUE(type, month, financial_year)
);

--- Time stamp addition ---

ALTER TABLE billing ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE purchase ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE items ADD COLUMN open_stock NUMERIC DEFAULT 0;

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
-- 2. PARTY WISE SALES: Aggregates client sales from `billing` and `billing_items` with date range support.
-- 3. GROUP SALES REPORT:
--    - Uses a polymorphic join on `group_members`.
--    - If `member_type` = 'client', joins with `clients` and `billing` for volume/amount.
--    - If `member_type` = 'jobber', resolves name (sales strictly from clients).
-- 4. JOB WORK REPORT: Aggregates inward production volume (quantities) from `purchase` and `purchase_items` by jobber and item. Supports granular item-level transaction ledgers.
-- 5. DAY BOOK: Provides a combined daily ledger of all Billing and Purchase transactions via a UNION ALL strategy, allowing for a single chronological view of operations.
-- 6. CHALLAN NUMBER LOGIC:
--    - Format: <sequence>/<MONTH>/<FY> (e.g., 6/APR/26-27).
--    - Financial Year: Starts April 1st, ends March 31st.
--    - Sequence: Resets every month. The sequence number is maintained in `challan_sequences` table.
--    - Consistency: Once a challan number is generated, it is NEVER reused, even if the record is deleted.
--    - Generation (Create): Sequence is incremented atomically during creation using `INSERT ... ON CONFLICT DO UPDATE`.
--    - Generation (Edit): The backend strictly evaluates date changes. If the month/FY changes, a new sequence is atomically generated. If it does not change, the original sequence is retained. Frontend inputs for challan_no are ignored.

-- 5. Stable Item Ordering:
--    - To prevent item shuffling during edits, both `billing_items` and `purchase_items` include an `order_index` column.
--    - The backend uses an UPSERT logic to edit items in place by their DB `id` while preserving their `order_index`. New items are appended with an incremented `order_index`.
--    - Queries fetch items `ORDER BY order_index ASC`.


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

