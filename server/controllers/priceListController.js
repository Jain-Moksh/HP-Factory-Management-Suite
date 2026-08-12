const priceListService = require('../services/priceListService');

const priceListController = {
  get: async (req, res, next) => {
    try {
      const data = await priceListService.get();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  updateDate: async (req, res, next) => {
    try {
      const { date } = req.body;
      if (!date) {
        return res.status(400).json({ success: false, message: 'Date is required' });
      }
      const data = await priceListService.updateDate(date);
      res.json({ success: true, message: 'Price list date updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  createCategory: async (req, res, next) => {
    try {
      const { category_name } = req.body;
      if (!category_name) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }
      const data = await priceListService.createCategory(category_name);
      res.status(201).json({ success: true, message: 'Category created successfully', data });
    } catch (err) {
      next(err);
    }
  },

  deleteCategory: async (req, res, next) => {
    try {
      const { id } = req.params;
      await priceListService.deleteCategory(id);
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  setCategoryItems: async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const { itemIds } = req.body;
      if (!Array.isArray(itemIds)) {
        return res.status(400).json({ success: false, message: 'itemIds array is required' });
      }
      const data = await priceListService.setCategoryItems(categoryId, itemIds);
      res.json({ success: true, message: 'Category items updated successfully', data });
    } catch (err) {
      next(err);
    }
  },

  removeItem: async (req, res, next) => {
    try {
      const { itemId } = req.params;
      await priceListService.removeItem(itemId);
      res.json({ success: true, message: 'Item removed from category successfully' });
    } catch (err) {
      next(err);
    }
  },

  reorderCategoryItems: async (req, res, next) => {
    try {
      const { categoryId } = req.params;
      const { orders } = req.body;
      if (!Array.isArray(orders)) {
        return res.status(400).json({ success: false, message: 'orders array is required' });
      }
      await priceListService.reorderCategoryItems(categoryId, orders);
      res.json({ success: true, message: 'Items reordered successfully' });
    } catch (err) {
      next(err);
    }
  },

  getAvailableItems: async (req, res, next) => {
    try {
      const data = await priceListService.getAvailableItems();
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = priceListController;
