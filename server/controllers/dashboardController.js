const db = require('../config/db');
const queries = require('../queries/dashboardQueries');

const dashboardController = {
    getLowStock: async (req, res, next) => {
        try {
            const result = await db.query(queries.getLowStockItems);
            res.json({
                success: true,
                count: result.rows.length,
                data: result.rows
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = dashboardController;
