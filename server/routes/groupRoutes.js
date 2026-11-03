const express = require('express');
const router = express.Router();
const { validateIdParam } = require('../utils/validateId');

// Record ids must be whole numbers; anything else gets a clear 400
router.param('id', validateIdParam);

const groupController = require('../controllers/groupController');

router.get('/', groupController.getAll);
router.get('/:id', groupController.getSingle);
router.post('/', groupController.create);
router.put('/:id', groupController.update);
router.delete('/:id', groupController.delete);

module.exports = router;
