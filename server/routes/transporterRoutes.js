const express = require('express');
const router = express.Router();
const { transporters } = require('../controllers/masterController');

router.get('/', transporters.list);
router.get('/:id', transporters.getById);
router.post('/', transporters.create);
router.put('/:id', transporters.update);

module.exports = router;
