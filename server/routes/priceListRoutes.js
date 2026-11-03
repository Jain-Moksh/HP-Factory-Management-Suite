const express = require('express');
const router = express.Router();
const { validateIdParam } = require('../utils/validateId');

// Record ids must be whole numbers; anything else gets a clear 400
router.param('id', validateIdParam);
router.param('categoryId', validateIdParam);
router.param('itemId', validateIdParam);

const priceListController = require('../controllers/priceListController');

// Main Price List Actions
router.get('/', priceListController.get);
router.put('/date', priceListController.updateDate);

// Category Actions
router.post('/categories', priceListController.createCategory);
router.delete('/categories/:id', priceListController.deleteCategory);
router.put('/categories/order', priceListController.reorderCategories);

// Item Assignments in Categories
router.get('/available-items', priceListController.getAvailableItems);
router.post('/categories/:categoryId/items', priceListController.setCategoryItems);
router.delete('/items/:itemId', priceListController.removeItem);
router.put('/categories/:categoryId/items/order', priceListController.reorderCategoryItems);

module.exports = router;
