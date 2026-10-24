const db = require('../config/db');
const queries = require('../queries/priceListQueries');
const { toUpperCase } = require('../utils/dataSanitizer');
const auditService = require('./auditService');

const getCategoryName = async (executor, categoryId) => {
  const res = await executor.query('SELECT category_name FROM price_list_categories WHERE id = $1', [categoryId]);
  return res.rows[0] ? res.rows[0].category_name : `#${categoryId}`;
};

const getCategoryItemNames = async (executor, categoryId) => {
  const res = await executor.query(queries.getCategoryItems, [categoryId]);
  return res.rows.map(i => i.name);
};

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
    const beforeRes = await db.query(queries.getPriceList);
    const result = await db.query(queries.updatePriceListDate, [date]);

    const before = { date: beforeRes.rows[0] ? beforeRes.rows[0].date : null };
    const after = { date: result.rows[0].date };
    await auditService.recordSafe({
      module: auditService.MODULES.PRICE_LIST,
      action: auditService.ACTIONS.UPDATE,
      recordId: 1,
      reference: 'PRICE LIST DATE',
      summary: `Price list date changed from ${before.date} to ${after.date}`,
      details: { before, after, changes: auditService.diffFields(before, after) }
    });

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

    await auditService.recordSafe({
      module: auditService.MODULES.PRICE_LIST,
      action: auditService.ACTIONS.CREATE,
      recordId: result.rows[0].id,
      reference: sanitized,
      summary: `Price list category ${sanitized} created`,
      details: { after: result.rows[0] }
    });

    return result.rows[0];
  },

  deleteCategory: async (id) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Item assignments are removed by ON DELETE CASCADE, so capture them first
      const itemNames = await getCategoryItemNames(client, id);
      const result = await client.query(queries.deleteCategory, [id]);
      if (result.rows.length === 0) {
        const err = new Error('Category not found');
        err.status = 404;
        throw err;
      }
      const category = result.rows[0];

      await auditService.archiveAndRecord(client, {
        module: auditService.MODULES.PRICE_LIST,
        recordId: category.id,
        reference: category.category_name,
        partyName: category.category_name,
        summary: `Price list category ${category.category_name} deleted and archived (${itemNames.length} item${itemNames.length === 1 ? '' : 's'})`,
        snapshot: { ...category, items: itemNames.join(', ') }
      });

      await client.query('COMMIT');
      return category;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
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

      const beforeItems = await getCategoryItemNames(client, categoryId);

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

      const categoryName = await getCategoryName(client, categoryId);
      const afterItems = await getCategoryItemNames(client, categoryId);
      const before = { items: beforeItems.join(', ') };
      const after = { items: afterItems.join(', ') };
      const added = afterItems.filter(n => !beforeItems.includes(n)).length;
      const removed = beforeItems.filter(n => !afterItems.includes(n)).length;
      await auditService.record(client, {
        module: auditService.MODULES.PRICE_LIST,
        action: auditService.ACTIONS.UPDATE,
        recordId: Number(categoryId),
        reference: categoryName,
        summary: `Price list category ${categoryName} items updated: ${added} added, ${removed} removed`,
        details: { before, after, changes: auditService.diffFields(before, after) }
      });

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

    const removed = result.rows[0];
    const itemRes = await db.query('SELECT name FROM items WHERE id = $1', [itemId]);
    const itemName = itemRes.rows[0] ? itemRes.rows[0].name : `#${itemId}`;
    const categoryName = await getCategoryName(db, removed.price_list_category_id);
    await auditService.recordSafe({
      module: auditService.MODULES.PRICE_LIST,
      action: auditService.ACTIONS.DELETE,
      recordId: Number(itemId),
      reference: categoryName,
      summary: `Item ${itemName} removed from price list category ${categoryName}`,
      details: { before: { ...removed, item_name: itemName, category_name: categoryName } }
    });

    return removed;
  },

  reorderCategoryItems: async (categoryId, orders) => {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const beforeItems = await getCategoryItemNames(client, categoryId);

      // orders: Array of { itemId, order }
      for (const entry of orders) {
        await client.query(queries.updateItemOrder, [entry.order, categoryId, entry.itemId]);
      }

      const categoryName = await getCategoryName(client, categoryId);
      const before = { item_order: beforeItems.join(', ') };
      const after = { item_order: (await getCategoryItemNames(client, categoryId)).join(', ') };
      await auditService.record(client, {
        module: auditService.MODULES.PRICE_LIST,
        action: auditService.ACTIONS.UPDATE,
        recordId: Number(categoryId),
        reference: categoryName,
        summary: `Price list category ${categoryName} items reordered`,
        details: { before, after, changes: auditService.diffFields(before, after) }
      });

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

      const categoryOrder = async () => (await client.query(queries.getCategories)).rows.map(c => c.name).join(', ');
      const before = { category_order: await categoryOrder() };

      // orders: Array of { categoryId, order }
      for (const entry of orders) {
        await client.query(queries.updateCategoryOrder, [entry.order, entry.categoryId]);
      }

      const after = { category_order: await categoryOrder() };
      await auditService.record(client, {
        module: auditService.MODULES.PRICE_LIST,
        action: auditService.ACTIONS.UPDATE,
        recordId: 1,
        reference: 'CATEGORY ORDER',
        summary: 'Price list categories reordered',
        details: { before, after, changes: auditService.diffFields(before, after) }
      });

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
