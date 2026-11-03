const express = require('express');
const router = express.Router();
const { validateIdParam } = require('../utils/validateId');

// Record ids must be whole numbers; anything else gets a clear 400
router.param('id', validateIdParam);

const billingController = require('../controllers/billingController');

router.post('/', billingController.create);
router.get('/', billingController.getAll);
router.get('/next-id', billingController.getNextId);
router.get('/next-challan', billingController.getNextChallan);
router.get('/by-challan', billingController.getByChallanNo);
router.get('/:id', billingController.getById);
router.put('/:id', billingController.update);
router.delete('/:id', billingController.delete);

module.exports = router;
