const express = require('express');
const router = express.Router();
const {
    recordSale,
    getSales,
    getSalesByProduct,
    getSalesByCategory,
    getDailySales
} = require('../controllers/salesController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', recordSale);
router.get('/', getSales);
router.get('/by-category', getSalesByCategory);
router.get('/daily', getDailySales);
router.get('/product/:id', getSalesByProduct);

module.exports = router;
