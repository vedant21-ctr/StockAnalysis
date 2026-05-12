const express = require('express');
const router = express.Router();
const {
    getExecutiveDashboard,
    getABCAnalysis,
    getSalesForecast,
    getSupplierPerformance,
    getInventoryHealth
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/executive', getExecutiveDashboard);
router.get('/abc-analysis', getABCAnalysis);
router.get('/forecast', getSalesForecast);
router.get('/suppliers', getSupplierPerformance);
router.get('/inventory-health', getInventoryHealth);

module.exports = router;
