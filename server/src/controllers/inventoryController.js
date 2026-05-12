const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// @desc    Get all products
// @route   GET /api/inventory/products
// @access  Private
exports.getProducts = async (req, res, next) => {
    try {
        const products = await Product.find().populate('supplier', 'name email phone');
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single product
// @route   GET /api/inventory/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('supplier');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.status(200).json({ success: true, data: product });
    } catch (err) {
        next(err);
    }
};

// @desc    Create new product
// @route   POST /api/inventory/products
// @access  Private (Admin only)
exports.createProduct = async (req, res, next) => {
    try {
        // If supplier is provided as ID string
        const product = await Product.create(req.body);
        res.status(201).json({ success: true, data: product });
    } catch (err) {
        next(err);
    }
};

// @desc    Update product
// @route   PUT /api/inventory/products/:id
// @access  Private (Admin/Staff)
exports.updateProduct = async (req, res, next) => {
    try {
        let product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ success: true, data: product });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete product
// @route   DELETE /api/inventory/products/:id
// @access  Private (Admin only)
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        await product.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        next(err);
    }
};

// @desc    Get low stock alerts
// @route   GET /api/inventory/alerts
// @access  Private
exports.getAlerts = async (req, res, next) => {
    try {
        // Find products where stockQuantity <= reorderThreshold
        const alerts = await Product.find({
            $expr: { $lte: ['$stockQuantity', '$reorderThreshold'] }
        }).sort({ stockQuantity: 1 });

        res.status(200).json({ success: true, count: alerts.length, data: alerts });
    } catch (err) {
        next(err);
    }
};
