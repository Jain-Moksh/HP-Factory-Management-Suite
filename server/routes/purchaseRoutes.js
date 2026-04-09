const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

router.post('/', purchaseController.create);
router.get('/:id', purchaseController.getById);

module.exports = router;
