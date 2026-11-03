const express = require('express');
const router = express.Router();
const { items, getItemTransactions, getStockCheck } = require('../controllers/masterController');

router.get('/', items.list);
router.get('/stock-check', getStockCheck);
router.get('/:id', items.getById);
router.get('/:id/transactions', getItemTransactions);
router.get('/:id/stock-check', getStockCheck);
router.post('/', items.create);
router.put('/:id', items.update);
router.delete('/:id', items.delete);

module.exports = router;
