const express = require('express');
const router = express.Router();
const { validateIdParam } = require('../utils/validateId');

// Record ids must be whole numbers; anything else gets a clear 400
router.param('id', validateIdParam);

const { transporters } = require('../controllers/masterController');

router.get('/', transporters.list);
router.get('/:id', transporters.getById);
router.post('/', transporters.create);
router.put('/:id', transporters.update);
router.delete('/:id', transporters.delete);

module.exports = router;
