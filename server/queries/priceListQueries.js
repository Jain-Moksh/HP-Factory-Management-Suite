const priceListQueries = {
    getPriceList: 'SELECT date FROM price_lists WHERE id = 1',
    updatePriceListDate: 'UPDATE price_lists SET date = $1 WHERE id = 1 RETURNING *',
    getCategories: 'SELECT id, category_name as name, display_order FROM price_list_categories WHERE price_list_id = 1 ORDER BY display_order ASC',
    
    getCategoryItems: `
        SELECT 
            i.id,
            i.name,
            i.rate,
            i.unit,
            pli.display_order
        FROM price_list_items pli
        JOIN items i ON pli.item_id = i.id
        WHERE pli.price_list_category_id = $1
        ORDER BY pli.display_order ASC
    `,
    
    checkCategoryExists: 'SELECT 1 FROM price_list_categories WHERE UPPER(category_name) = $1 AND price_list_id = 1',
    getNextCategoryOrder: 'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM price_list_categories WHERE price_list_id = 1',
    createCategory: 'INSERT INTO price_list_categories (price_list_id, category_name, display_order) VALUES (1, $1, $2) RETURNING *',
    deleteCategory: 'DELETE FROM price_list_categories WHERE id = $1 RETURNING *',
    
    checkItemAssigned: 'SELECT price_list_category_id FROM price_list_items WHERE item_id = $1',
    clearCategoryItems: 'DELETE FROM price_list_items WHERE price_list_category_id = $1',
    assignItemToCategory: 'INSERT INTO price_list_items (price_list_category_id, item_id, display_order) VALUES ($1, $2, $3) RETURNING *',
    removeItemFromCategory: 'DELETE FROM price_list_items WHERE item_id = $1 RETURNING *',
    updateItemOrder: 'UPDATE price_list_items SET display_order = $1 WHERE price_list_category_id = $2 AND item_id = $3 RETURNING *',
    
    getAvailableItems: `
        SELECT id, name, rate, unit, packing
        FROM items
        WHERE id NOT IN (SELECT item_id FROM price_list_items)
        ORDER BY name ASC
    `
};

module.exports = priceListQueries;
