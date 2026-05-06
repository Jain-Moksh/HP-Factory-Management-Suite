const billingQueries = {
    createBill: `
        INSERT INTO billing (
            client_id, transporter_id, date, transport_charge, packing_charge, 
            discount_percent, discount_amount, total_amount, short_remark, 
            long_remark, grand_total, challan_no
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
        RETURNING *
    `,
    createBillItem: `
        INSERT INTO billing_items (
            billing_id, item_id, rate, discount_percent, discount_amount, 
            unit, quantity, bundle, total_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *
    `,
    updateItemStock: `
        UPDATE items SET stock = stock - $1 WHERE id = $2
    `,
    reverseStockUpdate: `
        UPDATE items SET stock = stock + $1 WHERE id = $2
    `,
    getBillById: `
        SELECT 
            b.*,
            c.name as client_name,
            c.shortform as client_shortform,
            c.street as address1,
            c.city as address2,
            t.name as transporter_name
        FROM billing b
        JOIN clients c ON b.client_id = c.id
        LEFT JOIN transporters t ON b.transporter_id = t.id
        WHERE b.id = $1
    `,
    getBillItems: `
        SELECT 
            bi.*,
            i.name as item_name,
            i.conversion as conversion
        FROM billing_items bi
        JOIN items i ON bi.item_id = i.id
        WHERE bi.billing_id = $1
    `,
    getAllBills: `
        SELECT 
            b.*,
            c.name as client_name,
            c.shortform as client_shortform
        FROM billing b
        JOIN clients c ON b.client_id = c.id
        ORDER BY b.date DESC, b.id DESC
    `,
    deleteBill: 'DELETE FROM billing WHERE id = $1 RETURNING *',
    getNextBillId: 'SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM billing',
    updateBill: `
        UPDATE billing SET 
            client_id = $1, transporter_id = $2, date = $3, 
            transport_charge = $4, packing_charge = $5, 
            discount_percent = $6, discount_amount = $7, 
            total_amount = $8, short_remark = $9, 
            long_remark = $10, grand_total = $11, 
            challan_no = $12
        WHERE id = $13
        RETURNING *
    `,
    deleteBillItems: 'DELETE FROM billing_items WHERE billing_id = $1'
};

module.exports = billingQueries;
