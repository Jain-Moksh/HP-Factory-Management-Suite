const express = require('express');
const router = express.Router();
const { validateIdParam } = require('../utils/validateId');

// Record ids must be whole numbers; anything else gets a clear 400
router.param('id', validateIdParam);

const controller = require('../controllers/partyTransactionController');

router.get('/', controller.getAll);
router.get('/outstanding', controller.getOutstanding);
router.get('/next-challan', controller.getNextChallan);
router.get('/history', controller.getHistory);
router.get('/:id', controller.getById);
router.post('/bulk', controller.createBulk);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
