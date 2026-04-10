const express = require('express');
const router = express.Router();
const { clients } = require('../controllers/masterController');

router.get('/', clients.list);
router.get('/:id', clients.getById);
router.post('/', clients.create);
router.put('/:id', clients.update);
router.delete('/:id', clients.delete);

module.exports = router;
