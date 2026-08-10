const express = require('express');
const router = express.Router();
const controller = require('../controllers/partyTransactionController');

router.get('/', controller.getAll);
router.get('/outstanding', controller.getOutstanding);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
