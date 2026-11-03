const express = require('express');
const router = express.Router();
const { validateIdParam } = require('../utils/validateId');

// Record ids must be whole numbers; anything else gets a clear 400
router.param('id', validateIdParam);

const { 
  list, getById, create, update, delete: remove
} = require('../controllers/jobberController');

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
