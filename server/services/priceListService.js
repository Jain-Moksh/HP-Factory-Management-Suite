const db = require('../config/db');
const queries = require('../queries/priceListQueries');
const { toUpperCase } = require('../utils/dataSanitizer');

const priceListService = {
  get: async () => {
    // 1. Get Price List Date
    let priceListRes = await db.query(queries.getPriceList);
    
    // Self-healing: if no price list singleton row exists, create it
    if (priceListRes.rows.length === 0) {
      await db.query('INSERT INTO price_lists (id, date) VALUES (1, CURRENT_DATE) ON CONFLICT (id) DO NOTHING');
      priceListRes = await db.query(queries.getPriceList);
    }
    
    const date = priceListRes.rows[0].date;

    // 2. Get Categories
    const categoriesRes = await db.query(queries.getCategories);
    const categories = categoriesRes.rows;

    // 3. Get items for each category
    const resultCategories = [];
    for (const cat of categories) {
      const itemsRes = await db.query(queries.getCategoryItems, [cat.id]);
      resultCategories.push({
        id: cat.id,
        name: cat.name,
        display_order: cat.display_order,
        items: itemsRes.rows.map(item => ({
          id: item.id,
          name: item.name,
          rate: Number(item.rate),
          unit: item.unit,
          packing: item.packing,
          display_order: item.display_order
        }))
      });
    }

    return { date, categories: resultCategories };
  },

  updateDate: async (date) => {
    // Self-healing: ensure singleton row exists before updating
    await db.query('INSERT INTO price_lists (id, date) VALUES (1, CURRENT_DATE) ON CONFLICT (id) DO NOTHING');
    const result = await db.query(queries.updatePriceListDate, [date]);
    return result.rows[0];
  },

  createCategory: async (categoryName) => {
    const sanitized = toUpperCase(categoryName.trim());
    if (!sanitized) {
      throw new Error('Category name cannot be empty');
    }

    // Check for duplicates
    const checkRes = await db.query(queries.checkCategoryExists, [sanitized]);
    if (checkRes.rows.length > 0) {
      const err = new Error('A category with this name already exists');
      err.status = 400;
      throw err;
    }

    // Get next display order
    const orderRes = await db.query(queries.getNextCategoryOrder);
    const displayOrder = orderRes.rows[0].next_order;

    // Insert
    const result = await db.query(queries.createCategory, [sanitized, displayOrder]);
    return result.rows[0];
  },

  deleteCategory: async (id) => {
    const result = await db.query(queries.deleteCategory, [id]);
    if (result.rows.length === 0) {
      const err = new Error('Category not found');
      err.status = 404;
      throw err;
    }
    return result.rows[0];
  },

  setCategoryItems: async (categoryId, itemIds) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // 1. Verify category exists
      const catCheck = await client.query('SELECT 1 FROM price_list_categories WHERE id = $1', [categoryId]);
      if (catCheck.rows.length === 0) {
        const err = new Error('Category not found');
        err.status = 404;
        throw err;
      }

      // 2. Validate items are not assigned to a DIFFERENT category
      for (const itemId of itemIds) {
        const assignedCheck = await client.query(queries.checkItemAssigned, [itemId]);
        if (assignedCheck.rows.length > 0 && assignedCheck.rows[0].price_list_category_id !== parseInt(categoryId, 10)) {
          const err = new Error(`One or more selected items are already assigned to another category.`);
          err.status = 400;
          throw err;
        }
      }

      // 3. Clear existing items for this category
      await client.query(queries.clearCategoryItems, [categoryId]);

      // 4. Insert new items with sequential display order
      const insertedItems = [];
      for (let i = 0; i < itemIds.length; i++) {
        const itemId = itemIds[i];
        const displayOrder = i + 1;
        const res = await client.query(queries.assignItemToCategory, [categoryId, itemId, displayOrder]);
        insertedItems.push(res.rows[0]);
      }

      await client.query('COMMIT');
      return insertedItems;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  removeItem: async (itemId) => {
    const result = await db.query(queries.removeItemFromCategory, [itemId]);
    if (result.rows.length === 0) {
      const err = new Error('Item assignment not found');
      err.status = 404;
      throw err;
    }
    return result.rows[0];
  },

  reorderCategoryItems: async (categoryId, orders) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // orders: Array of { itemId, order }
      for (const entry of orders) {
        await client.query(queries.updateItemOrder, [entry.order, categoryId, entry.itemId]);
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  reorderCategories: async (orders) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // orders: Array of { categoryId, order }
      for (const entry of orders) {
        await client.query(queries.updateCategoryOrder, [entry.order, entry.categoryId]);
      }

      await client.query('COMMIT');
      return { success: true };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  getAvailableItems: async () => {
    const result = await db.query(queries.getAvailableItems);
    return result.rows.map(item => ({
      id: item.id,
      name: item.name,
      rate: Number(item.rate),
      unit: item.unit,
      packing: item.packing
    }));
  }
};

module.exports = priceListService;
