const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

// @desc    Executive Dashboard statistics
// @route   GET /api/analytics/executive
// @access  Private
exports.getExecutiveDashboard = async (req, res, next) => {
    try {
        const totalProducts = await Product.countDocuments();
        const lowStock = await Product.countDocuments({
            $expr: { $lte: ['$stockQuantity', '$reorderThreshold'] }
        });
        const outOfStock = await Product.countDocuments({ stockQuantity: 0 });

        const inventoryValueAgg = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: { $multiply: ['$stockQuantity', '$price'] } }
                }
            }
        ]);
        const inventoryValue = inventoryValueAgg.length > 0 ? inventoryValueAgg[0].totalValue : 0;

        const salesAgg = await Sale.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);
        const totalRevenue = salesAgg.length > 0 ? salesAgg[0].totalRevenue : 0;
        const totalSalesCount = salesAgg.length > 0 ? salesAgg[0].count : 0;

        // Profit calculation
        const profitAgg = await Sale.aggregate([
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
                $project: {
                    revenue: '$totalAmount',
                    cost: { $multiply: ['$quantity', '$productDetails.costPrice'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalProfit: { $sum: { $subtract: ['$revenue', '$cost'] } }
                }
            }
        ]);
        const totalProfit = profitAgg.length > 0 ? profitAgg[0].totalProfit : 0;
        const profitMargin = totalRevenue > 0
            ? ((totalProfit / totalRevenue) * 100).toFixed(2)
            : 0;

        // Monthly revenue for sparkline (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyRevenue = await Sale.aggregate([
            { $match: { saleDate: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$saleDate' } },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Category breakdown
        const categoryBreakdown = await Sale.aggregate([
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
                    units: { $sum: '$quantity' }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                lowStock,
                outOfStock,
                inventoryValue,
                totalRevenue,
                totalSalesCount,
                totalProfit,
                profitMargin,
                monthlyRevenue,
                categoryBreakdown
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    ABC Analysis
// @route   GET /api/analytics/abc-analysis
// @access  Private (Admin only)
exports.getABCAnalysis = async (req, res, next) => {
    try {
        const productsWithRevenue = await Sale.aggregate([
            {
                $group: {
                    _id: '$product',
                    productName: { $first: '$productName' },
                    revenue: { $sum: '$totalAmount' },
                    quantitySold: { $sum: '$quantity' }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        if (productsWithRevenue.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const totalRevenue = productsWithRevenue.reduce((sum, p) => sum + p.revenue, 0);
        let cumulativeRevenue = 0;

        const abcAnalysis = productsWithRevenue.map(p => {
            cumulativeRevenue += p.revenue;
            const cumulativePercentage = (cumulativeRevenue / totalRevenue) * 100;

            let category = 'C';
            if (cumulativePercentage <= 80) category = 'A';
            else if (cumulativePercentage <= 95) category = 'B';

            return {
                productId: p._id,
                name: p.productName,
                revenue: p.revenue,
                quantitySold: p.quantitySold,
                cumulativePercentage: cumulativePercentage.toFixed(2),
                category
            };
        });

        res.status(200).json({ success: true, data: abcAnalysis });
    } catch (err) {
        next(err);
    }
};

// @desc    Sales Forecasting
// @route   GET /api/analytics/forecast
// @access  Private
exports.getSalesForecast = async (req, res, next) => {
    try {
        const monthlySales = await Sale.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$saleDate' } },
                    revenue: { $sum: '$totalAmount' },
                    transactions: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Linear regression for trend
        const n = monthlySales.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        monthlySales.forEach((m, i) => {
            sumX += i;
            sumY += m.revenue;
            sumXY += i * m.revenue;
            sumX2 += i * i;
        });

        const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
        const intercept = n > 0 ? (sumY - slope * sumX) / n : 0;

        const forecast = monthlySales.map((m, i) => ({
            month: m._id,
            actual: m.revenue,
            predicted: Math.max(0, Math.round(intercept + slope * i)),
            transactions: m.transactions
        }));

        // Add 3 future months
        const lastDate = monthlySales.length > 0
            ? new Date(monthlySales[monthlySales.length - 1]._id + '-01')
            : new Date();

        for (let i = 1; i <= 3; i++) {
            const futureDate = new Date(lastDate);
            futureDate.setMonth(futureDate.getMonth() + i);
            const monthStr = futureDate.toISOString().slice(0, 7);
            const idx = n + i - 1;
            forecast.push({
                month: monthStr,
                actual: null,
                predicted: Math.max(0, Math.round(intercept + slope * idx)),
                isForecast: true
            });
        }

        res.status(200).json({
            success: true,
            methodology: 'Linear Regression',
            data: forecast
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Supplier Performance Tracking
// @route   GET /api/analytics/suppliers
// @access  Private
exports.getSupplierPerformance = async (req, res, next) => {
    try {
        const suppliers = await Supplier.find().select(
            'name qualityRating avgLeadTime onTimeDelivery isActive contactPerson email'
        );
        res.status(200).json({ success: true, data: suppliers });
    } catch (err) {
        next(err);
    }
};

// @desc    Get inventory health metrics
// @route   GET /api/analytics/inventory-health
// @access  Private
exports.getInventoryHealth = async (req, res, next) => {
    try {
        const products = await Product.find().populate('supplier', 'name');

        const healthData = products.map(p => ({
            id: p._id,
            name: p.name,
            category: p.category,
            stockQuantity: p.stockQuantity,
            reorderThreshold: p.reorderThreshold,
            stockValue: p.stockQuantity * p.price,
            margin: (((p.price - p.costPrice) / p.price) * 100).toFixed(1),
            status: p.stockQuantity === 0
                ? 'out'
                : p.stockQuantity <= p.reorderThreshold
                    ? 'low'
                    : 'healthy',
            supplier: p.supplier?.name || 'Unknown'
        }));

        const summary = {
            healthy: healthData.filter(p => p.status === 'healthy').length,
            low: healthData.filter(p => p.status === 'low').length,
            out: healthData.filter(p => p.status === 'out').length,
            totalValue: healthData.reduce((sum, p) => sum + p.stockValue, 0)
        };

        res.status(200).json({ success: true, data: healthData, summary });
    } catch (err) {
        next(err);
    }
};
