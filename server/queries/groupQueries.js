const groupQueries = {
    getAllGroups: `
        SELECT 
            g.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', gm.id,
                        'member_type', gm.member_type,
                        'member_id', gm.member_id,
                        'name', CASE 
                                    WHEN gm.member_type = 'jobber' THEN j.name 
                                    WHEN gm.member_type = 'client' THEN c.name 
                                END
                    )
                ) FILTER (WHERE gm.id IS NOT NULL), 
                '[]'
            ) as members
        FROM groups g
        LEFT JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN jobbers j ON gm.member_type = 'jobber' AND gm.member_id = j.id
        LEFT JOIN clients c ON gm.member_type = 'client' AND gm.member_id = c.id
        GROUP BY g.id
        ORDER BY g.name ASC
    `,

    getGroupById: `
        SELECT 
            g.*,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', gm.id,
                        'member_type', gm.member_type,
                        'member_id', gm.member_id,
                        'name', CASE 
                                    WHEN gm.member_type = 'jobber' THEN j.name 
                                    WHEN gm.member_type = 'client' THEN c.name 
                                END
                    )
                ) FILTER (WHERE gm.id IS NOT NULL), 
                '[]'
            ) as members
        FROM groups g
        LEFT JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN jobbers j ON gm.member_type = 'jobber' AND gm.member_id = j.id
        LEFT JOIN clients c ON gm.member_type = 'client' AND gm.member_id = c.id
        WHERE g.id = $1
        GROUP BY g.id
    `,

    createGroup: 'INSERT INTO groups (name, description) VALUES ($1, $2) RETURNING *',
    
    updateGroup: 'UPDATE groups SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
    
    deleteGroup: 'DELETE FROM groups WHERE id = $1 RETURNING *',

    addMember: 'INSERT INTO group_members (group_id, member_type, member_id) VALUES ($1, $2, $3) RETURNING *',
    
    deleteMembersByGroupId: 'DELETE FROM group_members WHERE group_id = $1',

    // Validation queries
    checkJobberExists: 'SELECT id FROM jobbers WHERE id = $1',
    checkClientExists: 'SELECT id FROM clients WHERE id = $1'
};

module.exports = groupQueries;
