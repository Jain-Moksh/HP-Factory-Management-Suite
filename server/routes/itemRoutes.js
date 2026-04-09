const express = require('express');
const router = express.Router();
const { items } = require('../controllers/masterController');

router.get('/', items.list);
router.get('/:id', items.getById);
router.post('/', items.create);
router.put('/:id', items.update);
router.delete('/:id', items.delete);

module.exports = router;
