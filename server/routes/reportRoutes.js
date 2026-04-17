const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/party-stock', reportController.getPartyStock);
router.get('/party-sales', reportController.getPartySales);
router.get('/group-sales', reportController.getGroupSales);
router.get('/job-work', reportController.getJobWork);
router.get('/party-stock-summary', reportController.getPartyStockSummary);
router.get('/party-stock-detail', reportController.getPartyStockDetail);

module.exports = router;
