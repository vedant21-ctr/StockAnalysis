const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getAlerts
} = require('../controllers/inventoryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.route('/products')
    .get(getProducts)
    .post(createProduct);

router.route('/products/:id')
    .get(getProduct)
    .put(updateProduct)
    .delete(deleteProduct);

router.get('/alerts', getAlerts);

module.exports = router;
