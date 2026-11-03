const express = require('express');
const router = express.Router();
const { validateIdParam } = require('../utils/validateId');

// Record ids must be whole numbers; anything else gets a clear 400
router.param('id', validateIdParam);

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
