const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

router.post('/', billingController.create);
router.get('/:id', billingController.getById);

module.exports = router;
