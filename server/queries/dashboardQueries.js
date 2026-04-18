const dashboardQueries = {
    getLowStockItems: `
        SELECT 
            id as item_id, 
            name as item_name, 
            stock, 
            unit, 
            min_stock 
        FROM items 
        WHERE stock < min_stock 
        ORDER BY stock ASC
    `
};

module.exports = dashboardQueries;
