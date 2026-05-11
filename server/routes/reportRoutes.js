const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/party-stock', reportController.getPartyStock);
router.get('/party-sales', reportController.getPartySales);
router.get('/group-sales', reportController.getGroupSales);
router.get('/job-work', reportController.getJobWork);
router.get('/party-stock-summary', reportController.getPartyStockSummary);
router.get('/party-stock-detail', reportController.getPartyStockDetail);
router.get('/group-sales-summary', reportController.getGroupSalesSummary);
router.get('/party-billing-detail', reportController.getPartyBillingDetail);
router.get('/job-work-summary', reportController.getJobWorkSummary);
router.get('/job-work-detail', reportController.getJobWorkDetail);
router.get('/day-book', reportController.getDayBook);
router.get('/detail-job-report', reportController.getDetailJobReport);
router.get('/job-summary', reportController.getJobSummaryReport);

module.exports = router;
