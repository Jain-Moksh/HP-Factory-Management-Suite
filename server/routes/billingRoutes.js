const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

router.post('/', billingController.create);
router.get('/', billingController.getAll);
router.get('/next-id', billingController.getNextId);
router.get('/:id', billingController.getById);
router.delete('/:id', billingController.delete);

module.exports = router;
