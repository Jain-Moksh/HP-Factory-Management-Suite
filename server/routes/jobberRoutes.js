const express = require('express');
const router = express.Router();
const { jobbers } = require('../controllers/masterController');

router.get('/', jobbers.list);
router.get('/:id', jobbers.getById);
router.post('/', jobbers.create);
router.put('/:id', jobbers.update);

module.exports = router;
