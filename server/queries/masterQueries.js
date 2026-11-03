const masterQueries = {
    // Items
    getAllItems: 'SELECT * FROM items ORDER BY name ASC',
    searchItems: 'SELECT * FROM items WHERE name ILIKE $1 ORDER BY name ASC',
    getItemById: 'SELECT * FROM items WHERE id = $1',
    createItem: 'INSERT INTO items (name, rate, stock, open_stock, conversion, unit, min_stock, packing) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    // Stock moves by exactly the opening-stock change, worked out from the row's own values in one statement,
    // so a bill or job work saved at the same moment is never overwritten (stock is never sent by the screen)
    updateItem: `UPDATE items SET name = $1, rate = $2,
        stock = COALESCE(stock, 0) + (COALESCE($3::numeric, open_stock, 0) - COALESCE(open_stock, 0)),
        open_stock = COALESCE($3::numeric, open_stock, 0), conversion = $4, unit = $5, min_stock = $6, packing = $7
        WHERE id = $8 RETURNING *`,

    // Clients
    getAllClients: 'SELECT * FROM clients ORDER BY name ASC',
    searchClients: 'SELECT * FROM clients WHERE name ILIKE $1 ORDER BY name ASC',
    getClientById: 'SELECT * FROM clients WHERE id = $1',
    createClient: 'INSERT INTO clients (name, street, city, shortform, balance, remark) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    updateClient: 'UPDATE clients SET name = $1, street = $2, city = $3, shortform = $4, balance = $5, remark = $6 WHERE id = $7 RETURNING *',

    // Jobbers
    getAllJobbers: 'SELECT * FROM jobbers ORDER BY name ASC',
    searchJobbers: 'SELECT * FROM jobbers WHERE name ILIKE $1 ORDER BY name ASC',
    getJobberById: 'SELECT * FROM jobbers WHERE id = $1',
    createJobber: 'INSERT INTO jobbers (name) VALUES ($1) RETURNING *',
    updateJobber: 'UPDATE jobbers SET name = $1 WHERE id = $2 RETURNING *',

    // Transporters
    getAllTransporters: 'SELECT * FROM transporters ORDER BY name ASC',
    searchTransporters: 'SELECT * FROM transporters WHERE name ILIKE $1 ORDER BY name ASC',
    getTransporterById: 'SELECT * FROM transporters WHERE id = $1',
    createTransporter: 'INSERT INTO transporters (name) VALUES ($1) RETURNING *',
    updateTransporter: 'UPDATE transporters SET name = $1 WHERE id = $2 RETURNING *',



    deleteItem: 'DELETE FROM items WHERE id = $1 RETURNING *',
    deleteClient: 'DELETE FROM clients WHERE id = $1 RETURNING *',
    deleteJobber: 'DELETE FROM jobbers WHERE id = $1 RETURNING *',
    deleteTransporter: 'DELETE FROM transporters WHERE id = $1 RETURNING *',

    // Saved stock vs. opening stock + job work - bills ($1 = one item id, or NULL for all mismatched items)
    getStockCheck: `
        WITH outward AS (SELECT item_id, SUM(quantity) AS qty FROM billing_items GROUP BY item_id),
             inward AS (SELECT item_id, SUM(quantity) AS qty FROM purchase_items GROUP BY item_id),
             checked AS (
                SELECT i.id, i.name, i.unit,
                       COALESCE(i.stock, 0) AS stock,
                       COALESCE(i.open_stock, 0) AS open_stock,
                       COALESCE(inw.qty, 0) AS inward,
                       COALESCE(outw.qty, 0) AS outward,
                       COALESCE(i.open_stock, 0) + COALESCE(inw.qty, 0) - COALESCE(outw.qty, 0) AS history_stock
                FROM items i
                LEFT JOIN inward inw ON inw.item_id = i.id
                LEFT JOIN outward outw ON outw.item_id = i.id
                WHERE $1::INT IS NULL OR i.id = $1::INT
             )
        SELECT *, stock - history_stock AS difference
        FROM checked
        WHERE $1::INT IS NOT NULL OR stock <> history_stock
        ORDER BY ABS(stock - history_stock) DESC, name ASC
    `,

    // Item Transaction History (Movement Ledger)
    getItemTransactions: `
        (
            SELECT 
                b.challan_no, 
                b.date, 
                0 as inward, 
                bi.quantity as outward, 
                'billing' as type,
                b.created_at,
                c.name as name
            FROM billing_items bi
            JOIN billing b ON bi.billing_id = b.id
            JOIN clients c ON b.client_id = c.id
            WHERE bi.item_id = $1
        )
        UNION ALL
        (
            SELECT 
                p.challan_no, 
                p.date, 
                pi.quantity as inward, 
                0 as outward, 
                'purchase' as type,
                p.created_at,
                j.name as name
            FROM purchase_items pi
            JOIN purchase p ON pi.purchase_id = p.id
            JOIN jobbers j ON p.jobber_id = j.id
            WHERE pi.item_id = $1
        )
        ORDER BY date DESC, created_at DESC
    `
};

module.exports = masterQueries;
