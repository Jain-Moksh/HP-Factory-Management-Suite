-- =========================
-- MASTER TABLES
-- =========================

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    rate NUMERIC,
    stock NUMERIC,
    conversion NUMERIC,
    unit TEXT
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

--- Time stamp addition ---

ALTER TABLE billing ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE purchase ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;