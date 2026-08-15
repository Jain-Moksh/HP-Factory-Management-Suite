const partyTransactionQueries = {
    insertTransaction: `
        INSERT INTO party_transactions (
            party_type, party_id, transaction_type, date, 
            challan_no, amount, payment_mode, remark
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *
    `,
    getTransactionList: `
        SELECT 
            pt.*,
            CASE 
                WHEN pt.party_type = 'CLIENT' THEN c.name 
                WHEN pt.party_type = 'JOBBER' THEN j.name 
            END as party_name
        FROM party_transactions pt
        LEFT JOIN clients c ON pt.party_type = 'CLIENT' AND pt.party_id = c.id
        LEFT JOIN jobbers j ON pt.party_type = 'JOBBER' AND pt.party_id = j.id
        ORDER BY pt.date DESC, pt.id DESC
    `,
    getTransactionById: `
        SELECT 
            pt.*,
            CASE 
                WHEN pt.party_type = 'CLIENT' THEN c.name 
                WHEN pt.party_type = 'JOBBER' THEN j.name 
            END as party_name
        FROM party_transactions pt
        LEFT JOIN clients c ON pt.party_type = 'CLIENT' AND pt.party_id = c.id
        LEFT JOIN jobbers j ON pt.party_type = 'JOBBER' AND pt.party_id = j.id
        WHERE pt.id = $1
    `,
    updateTransaction: `
        UPDATE party_transactions SET 
            date = $1, 
            amount = $2, 
            payment_mode = $3, 
            remark = $4,
            challan_no = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 
        RETURNING *
    `,
    deleteTransaction: `
        DELETE FROM party_transactions WHERE id = $1 RETURNING *
    `,
    getClientBillingTotal: `
        SELECT COALESCE(SUM(grand_total), 0) as total 
        FROM billing 
        WHERE client_id = $1
    `,
    getClientTransactionTotals: `
        SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'PAYMENT' THEN amount ELSE 0 END), 0) as total_payments,
            COALESCE(SUM(CASE WHEN transaction_type = 'RETURN' THEN amount ELSE 0 END), 0) as total_returns,
            COALESCE(SUM(CASE WHEN transaction_type = 'DISCOUNT' THEN amount ELSE 0 END), 0) as total_discounts
        FROM party_transactions
        WHERE party_type = 'CLIENT' AND party_id = $1
    `,
    getJobberTransactionTotals: `
        SELECT 
            COALESCE(SUM(CASE WHEN transaction_type = 'PAYMENT' THEN amount ELSE 0 END), 0) as total_payments,
            COALESCE(SUM(CASE WHEN transaction_type = 'RETURN' THEN amount ELSE 0 END), 0) as total_returns,
            COALESCE(SUM(CASE WHEN transaction_type = 'DISCOUNT' THEN amount ELSE 0 END), 0) as total_discounts
        FROM party_transactions
        WHERE party_type = 'JOBBER' AND party_id = $1
    `,
    getClientHistory: `
        SELECT 
            'BILLING' AS transaction_type,
            challan_no,
            date::TEXT,
            amount,
            created_at
        FROM (
            SELECT 
                challan_no,
                date,
                grand_total AS amount,
                created_at
            FROM billing
            WHERE client_id = $1
              AND date >= $2 AND date <= $3
            
            UNION ALL
            
            SELECT 
                challan_no,
                date,
                amount,
                created_at
            FROM party_transactions
            WHERE party_type = 'CLIENT' AND party_id = $1
              AND date >= $2 AND date <= $3
        ) combined_history
        ORDER BY date ASC, created_at ASC
    `,
    getJobberHistory: `
        SELECT 
            transaction_type,
            challan_no,
            date::TEXT,
            amount,
            created_at
        FROM party_transactions
        WHERE party_type = 'JOBBER' AND party_id = $1
          AND date >= $2 AND date <= $3
        ORDER BY date ASC, created_at ASC
    `
};

module.exports = partyTransactionQueries;
