const Sale = require('../models/Sale');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Record a new sale
// @route   POST /api/sales
// @access  Private
exports.recordSale = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { product: productId, quantity, customerName } = req.body;

        // 1. Check if product exists
        const product = await Product.findById(productId).session(session);
        if (!product) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // 2. Check if enough stock
        if (product.stockQuantity < quantity) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Available: ${product.stockQuantity}`
            });
        }

        // 3. Create sale record
        const sale = await Sale.create([{
            product: productId,
            productName: product.name,
            quantity,
            unitPrice: product.price,
            customerName,
            soldBy: req.user.id
        }], { session });

        // 4. Decrement stock
        product.stockQuantity -= quantity;
        await product.save({ session });

        await session.commitTransaction();
        session.endSession();

        // 5. Emit realtime events via Socket.IO
        const io = req.app.get('io');
        if (io) {
            // Broadcast new sale to dashboard room
            io.to('dashboard').emit('sale:new', {
                id: sale[0]._id,
                productName: product.name,
                quantity,
                totalAmount: sale[0].totalAmount,
                customerName: customerName || 'Walk-in Customer',
                timestamp: new Date().toISOString()
            });

            // Broadcast inventory update
            io.to('inventory').emit('inventory:updated', {
                productId: product._id,
                productName: product.name,
                newStock: product.stockQuantity,
                reorderThreshold: product.reorderThreshold,
                isLowStock: product.stockQuantity <= product.reorderThreshold
            });

            // Emit low stock alert if needed
            if (product.stockQuantity <= product.reorderThreshold) {
                io.to('dashboard').emit('alert:lowstock', {
                    productId: product._id,
                    productName: product.name,
                    currentStock: product.stockQuantity,
                    reorderThreshold: product.reorderThreshold,
                    timestamp: new Date().toISOString()
                });
            }
        }

        res.status(201).json({
            success: true,
            data: sale[0],
            message: 'Sale recorded and stock updated'
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
    }
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
exports.getSales = async (req, res, next) => {
    try {
        const sales = await Sale.find()
            .populate('product', 'name sku price category')
            .sort({ saleDate: -1 });
        res.status(200).json({ success: true, count: sales.length, data: sales });
    } catch (err) {
        next(err);
    }
};

// @desc    Get sales statistics for a specific product
// @route   GET /api/sales/product/:id
// @access  Private
exports.getSalesByProduct = async (req, res, next) => {
    try {
        const sales = await Sale.find({ product: req.params.id }).sort({ saleDate: -1 });
        const totalSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

        res.status(200).json({
            success: true,
            data: sales,
            stats: { totalSold, totalRevenue }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get sales grouped by category
// @route   GET /api/sales/by-category
// @access  Private
exports.getSalesByCategory = async (req, res, next) => {
    try {
        const data = await Sale.aggregate([
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $group: {
                    _id: '$productDetails.category',
                    revenue: { $sum: '$totalAmount' },
                    units: { $sum: '$quantity' },
                    transactions: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

// @desc    Get daily sales for the last 30 days
// @route   GET /api/sales/daily
// @access  Private
exports.getDailySales = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const data = await Sale.aggregate([
            { $match: { saleDate: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
                    revenue: { $sum: '$totalAmount' },
                    transactions: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};
