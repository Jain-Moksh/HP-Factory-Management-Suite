-- =========================
-- MASTER TABLES
-- =========================

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    rate NUMERIC,
    stock NUMERIC,
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
    challan_no TEXT,

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
    challan_no TEXT,

    FOREIGN KEY (jobber_id) REFERENCES jobbers(id)
);

CREATE TABLE purchase_items (
    id SERIAL PRIMARY KEY,
    
    purchase_id INT NOT NULL,
    item_id INT NOT NULL,
    
    quantity NUMERIC,
    unit TEXT,

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

--- Time stamp addition ---

ALTER TABLE billing ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE purchase ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- =============================================
-- DATA CLEANUP: UPPERCASE CONVERSION
-- =============================================

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