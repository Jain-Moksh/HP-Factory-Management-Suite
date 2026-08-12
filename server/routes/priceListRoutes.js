const express = require('express');
const router = express.Router();
const priceListController = require('../controllers/priceListController');

// Main Price List Actions
router.get('/', priceListController.get);
router.put('/date', priceListController.updateDate);

// Category Actions
router.post('/categories', priceListController.createCategory);
router.delete('/categories/:id', priceListController.deleteCategory);

// Item Assignments in Categories
router.get('/available-items', priceListController.getAvailableItems);
router.post('/categories/:categoryId/items', priceListController.setCategoryItems);
router.delete('/items/:itemId', priceListController.removeItem);
router.put('/categories/:categoryId/items/order', priceListController.reorderCategoryItems);

module.exports = router;
