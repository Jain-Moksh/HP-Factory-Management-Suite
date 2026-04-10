const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

router.post('/', purchaseController.create);
router.get('/', purchaseController.getAll);
router.get('/next-id', purchaseController.getNextId);
router.get('/:id', purchaseController.getById);
router.put('/:id', purchaseController.update);
router.delete('/:id', purchaseController.delete);

module.exports = router;
