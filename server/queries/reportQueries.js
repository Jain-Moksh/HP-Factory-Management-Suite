const reportQueries = {
    // 1. Party Wise Stock Report
    // Returns items linked to jobbers via jobber_items
    getPartyStock: `
        SELECT 
            j.name as party_name, 
            i.name as item_name, 
            i.stock, 
            i.unit 
        FROM jobbers j 
        JOIN jobber_items ji ON j.id = ji.jobber_id 
        JOIN items i ON ji.item_id = i.id
        ORDER BY j.name, i.name
    `,

    // 2. Party Wise Sales Report
    // Aggregates sales (billing) by client and date range
    getPartySales: `
        SELECT 
            c.id as client_id,
            c.name as client_name, 
            COALESCE(SUM(bi.quantity), 0) as total_quantity, 
            COALESCE(SUM(bi.total_amount), 0) as total_amount 
        FROM clients c
        LEFT JOIN billing b ON c.id = b.client_id AND (b.date BETWEEN $1 AND $2 OR $1 IS NULL)
        LEFT JOIN billing_items bi ON b.id = bi.billing_id
        WHERE ($3::INT IS NULL OR c.id = $3)
        GROUP BY c.id, c.name
        ORDER BY total_amount DESC
    `,

    // 3. Group Party Wise Sales Report
    // Aggregates sales based on group membership
    getGroupSales: `
        SELECT 
            g.name as group_name, 
            CASE 
                WHEN gm.member_type = 'client' THEN c.name 
                WHEN gm.member_type = 'jobber' THEN j.name 
            END as member_name, 
            gm.member_type, 
            COALESCE(SUM(bi.total_amount), 0) as total_sales 
        FROM groups g 
        JOIN group_members gm ON g.id = gm.group_id 
        LEFT JOIN clients c ON gm.member_id = c.id AND gm.member_type = 'client' 
        LEFT JOIN jobbers j ON gm.member_id = j.id AND gm.member_type = 'jobber' 
        LEFT JOIN billing b ON b.client_id = c.id AND gm.member_type = 'client' AND (b.date BETWEEN $1 AND $2 OR $1 IS NULL)
        LEFT JOIN billing_items bi ON b.id = bi.billing_id 
        GROUP BY g.id, g.name, gm.member_id, gm.member_type, c.name, j.name
        ORDER BY g.name, member_name
    `,

    // 4. Job Work Report
    // Aggregates purchase/job work by jobber and item
    getJobWorkReport: `
        SELECT 
            j.name as jobber_name, 
            i.name as item_name, 
            COALESCE(SUM(pi.quantity), 0) as total_quantity 
        FROM jobbers j
        LEFT JOIN purchase p ON j.id = p.jobber_id AND (p.date BETWEEN $1 AND $2 OR $1 IS NULL)
        LEFT JOIN purchase_items pi ON p.id = pi.purchase_id
        LEFT JOIN items i ON pi.item_id = i.id
        GROUP BY j.id, j.name, i.id, i.name
        HAVING i.name IS NOT NULL
        ORDER BY j.name, total_quantity DESC
    `,

    // 5. Party Wise Stock Summary (Total quantity billed to client)
    getPartyStockSummary: `
        SELECT 
            bi.item_id,
            i.name AS item_name,
            SUM(bi.quantity) AS total_quantity,
            i.unit
        FROM billing b
        JOIN billing_items bi ON b.id = bi.billing_id
        JOIN items i ON bi.item_id = i.id
        WHERE b.client_id = $1
          AND ($2::DATE IS NULL OR b.date >= $2)
          AND ($3::DATE IS NULL OR b.date <= $3)
        GROUP BY bi.item_id, i.name, i.unit
        ORDER BY i.name
    `,

    // 6. Party Wise Stock Detail (Ledger for client-item)
    getPartyStockDetail: `
        SELECT 
            b.challan_no,
            b.date,
            bi.quantity
        FROM billing b
        JOIN billing_items bi ON b.id = bi.billing_id
        WHERE b.client_id = $1
          AND bi.item_id = $2
          AND ($3::DATE IS NULL OR b.date >= $3)
          AND ($4::DATE IS NULL OR b.date <= $4)
        ORDER BY b.date ASC
    `,

    // 7. Group Sales Summary (Revenue from clients in a group)
    getGroupSalesSummary: `
        SELECT 
            c.id as client_id,
            c.name as client_name,
            COALESCE(SUM(b.grand_total), 0) as total_amount
        FROM group_members gm
        JOIN clients c ON gm.member_id = c.id AND gm.member_type = 'client'
        LEFT JOIN billing b ON b.client_id = c.id 
            AND ($2::DATE IS NULL OR b.date >= $2)
            AND ($3::DATE IS NULL OR b.date <= $3)
        WHERE gm.group_id = $1
        GROUP BY c.id, c.name
        ORDER BY total_amount DESC
    `,

    // 8. Party Billing Detail (Ledger for client)
    getPartyBillingDetail: `
        SELECT 
            challan_no,
            date,
            grand_total as amount
        FROM billing
        WHERE client_id = $1
          AND ($2::DATE IS NULL OR date >= $2)
          AND ($3::DATE IS NULL OR date <= $3)
        ORDER BY date ASC
    `,

    // 9. Job Work Summary (Aggregate by item for a jobber)
    getJobWorkSummary: `
        SELECT 
            i.id as item_id,
            i.name as item_name,
            SUM(pi.quantity) as total_quantity,
            i.unit
        FROM purchase p
        JOIN purchase_items pi ON p.id = pi.purchase_id
        JOIN items i ON pi.item_id = i.id
        WHERE p.jobber_id = $1
          AND ($2::DATE IS NULL OR p.date >= $2)
          AND ($3::DATE IS NULL OR p.date <= $3)
        GROUP BY i.id, i.name, i.unit
        ORDER BY i.name ASC
    `,

    // 10. Job Work Detail (Ledger for jobber-item)
    getJobWorkDetail: `
        SELECT 
            p.challan_no,
            p.date,
            pi.quantity
        FROM purchase p
        JOIN purchase_items pi ON p.id = pi.purchase_id
        WHERE p.jobber_id = $1
          AND pi.item_id = $2
          AND ($3::DATE IS NULL OR p.date >= $3)
          AND ($4::DATE IS NULL OR p.date <= $4)
        ORDER BY p.date ASC
    `,

    // 11. Day Book (Combined Billing & Purchase for a date)
    getDayBook: `
        (SELECT 
            b.id, 
            'billing' as type, 
            b.challan_no, 
            c.name as name, 
            b.grand_total as amount, 
            b.created_at
        FROM billing b
        JOIN clients c ON b.client_id = c.id
        WHERE b.date = $1)
        UNION ALL
        (SELECT 
            p.id, 
            'purchase' as type, 
            p.challan_no, 
            j.name as name, 
            NULL as amount, 
            p.created_at
        FROM purchase p
        JOIN jobbers j ON p.jobber_id = j.id
        WHERE p.date = $1)
        ORDER BY created_at DESC
    `,

    // 12. Detail Job Report (Inward stock movement)
    getDetailJobReport: `
        SELECT
            p.id AS purchase_id,
            p.date,
            pi.id AS purchase_item_id,
            pi.quantity,
            pi.order_index,
            i.name AS item_name
        FROM purchase p
        JOIN purchase_items pi ON pi.purchase_id = p.id
        JOIN items i ON i.id = pi.item_id
        WHERE p.date BETWEEN $1 AND $2
        ORDER BY
            p.date ASC,
            p.id ASC,
            pi.order_index ASC,
            pi.id ASC;
    `
};

module.exports = reportQueries;

