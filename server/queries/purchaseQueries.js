const purchaseQueries = {
    createPurchase: `
        INSERT INTO purchase (jobber_id, date, remark, challan_no) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *
    `,
    createPurchaseItem: `
        INSERT INTO purchase_items (purchase_id, item_id, quantity, unit, order_index) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *
    `,
    updatePurchaseItem: `
        UPDATE purchase_items SET
            item_id = $1, quantity = $2, unit = $3, order_index = $4
        WHERE id = $5
        RETURNING *
    `,
    deleteSinglePurchaseItem: `
        DELETE FROM purchase_items WHERE id = $1 RETURNING *
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
        ORDER BY pi.order_index ASC, pi.id ASC
    `,
    getAllPurchases: `
        SELECT 
            p.*,
            j.name as jobber_name
        FROM purchase p
        JOIN jobbers j ON p.jobber_id = j.id
        ORDER BY p.date DESC, p.id DESC
    `,
    getNextPurchaseId: `
        SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM purchase
    `,
    deletePurchase: `
        DELETE FROM purchase WHERE id = $1
    `,
    deletePurchaseItems: `
        DELETE FROM purchase_items WHERE purchase_id = $1
    `,
    reverseStockUpdate: `
        UPDATE items SET stock = stock - $1 WHERE id = $2
    `,
    updatePurchase: `
        UPDATE purchase SET 
            jobber_id = $1, date = $2, remark = $3, challan_no = $4
        WHERE id = $5
        RETURNING *
    `
};

module.exports = purchaseQueries;
