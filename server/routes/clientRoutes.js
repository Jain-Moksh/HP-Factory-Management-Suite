const express = require('express');
const router = express.Router();
const { validateIdParam } = require('../utils/validateId');

// Record ids must be whole numbers; anything else gets a clear 400
router.param('id', validateIdParam);

const { clients } = require('../controllers/masterController');

router.get('/', clients.list);
router.get('/:id', clients.getById);
router.post('/', clients.create);
router.put('/:id', clients.update);
router.delete('/:id', clients.delete);

module.exports = router;
