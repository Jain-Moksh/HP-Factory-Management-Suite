const masterQueries = {
    // Items
    getAllItems: 'SELECT * FROM items ORDER BY name ASC',
    searchItems: 'SELECT * FROM items WHERE name ILIKE $1 ORDER BY name ASC',
    getItemById: 'SELECT * FROM items WHERE id = $1',
    createItem: 'INSERT INTO items (name, rate, stock, open_stock, conversion, unit, min_stock) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    updateItem: 'UPDATE items SET name = $1, rate = $2, stock = $3, open_stock = $4, conversion = $5, unit = $6, min_stock = $7 WHERE id = $8 RETURNING *',

    // Clients
    getAllClients: 'SELECT * FROM clients ORDER BY name ASC',
    searchClients: 'SELECT * FROM clients WHERE name ILIKE $1 ORDER BY name ASC',
    getClientById: 'SELECT * FROM clients WHERE id = $1',
    createClient: 'INSERT INTO clients (name, street, city, shortform, balance, remark) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    updateClient: 'UPDATE clients SET name = $1, street = $2, city = $3, shortform = $4, balance = $5, remark = $6 WHERE id = $7 RETURNING *',

    // Jobbers
    getAllJobbers: `
        SELECT 
            j.*,
            COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') as items
        FROM jobbers j
        LEFT JOIN jobber_items ji ON j.id = ji.jobber_id
        LEFT JOIN items i ON ji.item_id = i.id
        GROUP BY j.id
        ORDER BY j.name ASC
    `,
    searchJobbers: `
        SELECT 
            j.*,
            COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') as items
        FROM jobbers j
        LEFT JOIN jobber_items ji ON j.id = ji.jobber_id
        LEFT JOIN items i ON ji.item_id = i.id
        WHERE j.name ILIKE $1
        GROUP BY j.id
        ORDER BY j.name ASC
    `,
    getJobberById: 'SELECT * FROM jobbers WHERE id = $1',
    createJobber: 'INSERT INTO jobbers (name) VALUES ($1) RETURNING *',
    updateJobber: 'UPDATE jobbers SET name = $1 WHERE id = $2 RETURNING *',

    // Transporters
    getAllTransporters: 'SELECT * FROM transporters ORDER BY name ASC',
    searchTransporters: 'SELECT * FROM transporters WHERE name ILIKE $1 ORDER BY name ASC',
    getTransporterById: 'SELECT * FROM transporters WHERE id = $1',
    createTransporter: 'INSERT INTO transporters (name) VALUES ($1) RETURNING *',
    updateTransporter: 'UPDATE transporters SET name = $1 WHERE id = $2 RETURNING *',

    // Jobber Items
    getJobberItems: `
        SELECT 
            i.*,
            ji.id as mapping_id
        FROM jobber_items ji
        JOIN items i ON ji.item_id = i.id
        WHERE ji.jobber_id = $1
        ORDER BY i.name ASC
    `,

    deleteItem: 'DELETE FROM items WHERE id = $1 RETURNING *',
    deleteClient: 'DELETE FROM clients WHERE id = $1 RETURNING *',
    deleteJobber: 'DELETE FROM jobbers WHERE id = $1 RETURNING *',

    // Item Transaction History (Movement Ledger)
    getItemTransactions: `
        (
            SELECT 
                b.challan_no, 
                b.date, 
                0 as inward, 
                bi.quantity as outward, 
                'billing' as type,
                b.created_at
            FROM billing_items bi
            JOIN billing b ON bi.billing_id = b.id
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
                p.created_at
            FROM purchase_items pi
            JOIN purchase p ON pi.purchase_id = p.id
            WHERE pi.item_id = $1
        )
        ORDER BY date DESC, created_at DESC
    `
};

module.exports = masterQueries;
