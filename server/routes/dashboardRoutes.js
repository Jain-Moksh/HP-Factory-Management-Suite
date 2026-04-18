const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/low-stock', dashboardController.getLowStock);

module.exports = router;
