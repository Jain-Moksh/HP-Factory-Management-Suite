const express = require('express');
const router = express.Router();
const { 
  list, getById, create, update, assignItems, getAssignedItems, delete: remove
} = require('../controllers/jobberController');

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

// Many-to-Many: Items assigned to Jobber
router.post('/:id/items', assignItems);
router.get('/:id/items', getAssignedItems);

module.exports = router;
