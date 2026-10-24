const auditQueries = {
    insertLog: `
        INSERT INTO audit_logs (
            module, action, record_id, reference, summary, details,
            device_name, hostname, ip_address, os, browser, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
    `,
    insertArchive: `
        INSERT INTO archived_records (
            entity_type, original_id, reference, party_name, record_date, amount, data,
            device_name, hostname, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
    `,
    getLogById: 'SELECT * FROM audit_logs WHERE id = $1',
    getArchivedById: 'SELECT * FROM archived_records WHERE id = $1',
    getDevices: `
        SELECT
            COALESCE(device_name, hostname, ip_address) AS device,
            MAX(created_at) AS last_seen,
            COUNT(*)::INT AS total
        FROM audit_logs
        WHERE COALESCE(device_name, hostname, ip_address) IS NOT NULL
        GROUP BY COALESCE(device_name, hostname, ip_address)
        ORDER BY last_seen DESC
    `
};

module.exports = auditQueries;
