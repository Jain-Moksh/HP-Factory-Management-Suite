const purchaseQueries = {
    createPurchase: `
        INSERT INTO purchase (jobber_id, date, remark) 
        VALUES ($1, $2, $3) 
        RETURNING *
    `,
    createPurchaseItem: `
        INSERT INTO purchase_items (purchase_id, item_id, quantity, unit) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *
    `,
    updateItemStock: `
        UPDATE items SET stock = stock + $1 WHERE id = $2
    `,
    getPurchaseById: `
        SELECT 
            p.*,
            j.name as jobber_name
        FROM purchase p
        JOIN jobbers j ON p.jobber_id = j.id
        WHERE p.id = $1
    `,
    getPurchaseItems: `
        SELECT 
            pi.*,
            i.name as item_name
        FROM purchase_items pi
        JOIN items i ON pi.item_id = i.id
        WHERE pi.purchase_id = $1
    `
};

module.exports = purchaseQueries;
