const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');

router.get('/', auditController.list);
router.get('/counts', auditController.getModuleCounts);
router.get('/devices', auditController.getDevices);
router.get('/whoami', auditController.whoAmI);
router.get('/stock-movements', auditController.listStockMovements);
router.get('/stock-movements/devices', auditController.getStockMovementDevices);
router.get('/archived', auditController.listArchived);
router.get('/archived/:id', auditController.getArchivedById);
router.get('/:id', auditController.getById);

module.exports = router;
