const express = require('express');
const router = express.Router();

// Mock data
const mockProducts = [
    {
        id: 1,
        name: 'iPhone 14 Pro',
        description: 'Latest Apple smartphone with advanced camera system',
        sku: 'IPH14PRO-128',
        category_id: 1,
        category_name: 'Electronics',
        price: 999.99,
        cost_price: 750.00,
        stock_quantity: 25,
        reorder_threshold: 5,
        max_stock_level: 100,
        stock_status: 'In Stock',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
    },
    {
        id: 2,
        name: 'Samsung Galaxy S23',
        description: 'Premium Android smartphone with excellent display',
        sku: 'SAM-S23-256',
        category_id: 1,
        category_name: 'Electronics',
        price: 899.99,
        cost_price: 650.00,
        stock_quantity: 3,
        reorder_threshold: 5,
        max_stock_level: 80,
        stock_status: 'Low Stock',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-14T00:00:00Z'
    },
    {
        id: 3,
        name: 'MacBook Air M2',
        description: 'Lightweight laptop with Apple M2 chip',
        sku: 'MBA-M2-256',
        category_id: 1,
        category_name: 'Electronics',
        price: 1199.99,
        cost_price: 900.00,
        stock_quantity: 0,
        reorder_threshold: 3,
        max_stock_level: 50,
        stock_status: 'Out of Stock',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-13T00:00:00Z'
    },
    {
        id: 4,
        name: 'Nike Air Max 270',
        description: 'Comfortable running shoes',
        sku: 'NIKE-AM270-10',
        category_id: 2,
        category_name: 'Clothing',
        price: 149.99,
        cost_price: 75.00,
        stock_quantity: 45,
        reorder_threshold: 15,
        max_stock_level: 200,
        stock_status: 'In Stock',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-12T00:00:00Z'
    },
    {
        id: 5,
        name: 'Dyson V15 Detect',
        description: 'Cordless vacuum cleaner with laser detection',
        sku: 'DYSON-V15',
        category_id: 4,
        category_name: 'Home & Garden',
        price: 749.99,
        cost_price: 500.00,
        stock_quantity: 6,
        reorder_threshold: 2,
        max_stock_level: 25,
        stock_status: 'Low Stock',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-11T00:00:00Z'
    }
];

const mockSales = [];
// Generate mock sales data
const customers = ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emily Davis', 'Robert Brown'];
for (let i = 0; i < 30; i++) {
    const productIndex = Math.floor(Math.random() * mockProducts.length);
    const product = mockProducts[productIndex];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const daysAgo = Math.floor(Math.random() * 30);
    const saleDate = new Date();
    saleDate.setDate(saleDate.getDate() - daysAgo);
    
    mockSales.push({
        id: i + 1,
        product_id: product.id,
        product_name: product.name,
        quantity_sold: quantity,
        unit_price: product.price,
        total_amount: quantity * product.price,
        customer_name: customers[Math.floor(Math.random() * customers.length)],
        sale_date: saleDate.toISOString()
    });
}

// Products endpoints
router.get('/products', (req, res) => {
    const { page = 1, limit = 10, search = '', category = '', status = 'all' } = req.query;
    
    let filteredProducts = [...mockProducts];
    
    // Apply search filter
    if (search) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
        );
    }
    
    // Apply category filter
    if (category) {
        filteredProducts = filteredProducts.filter(p => p.category_id == category);
    }
    
    // Apply status filter
    if (status !== 'all') {
        const statusMap = {
            'low': 'Low Stock',
            'out': 'Out of Stock',
            'in': 'In Stock'
        };
        filteredProducts = filteredProducts.filter(p => p.stock_status === statusMap[status]);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    res.json({
        products: paginatedProducts,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(filteredProducts.length / limit),
            totalItems: filteredProducts.length,
            itemsPerPage: parseInt(limit)
        }
    });
});

router.get('/products/:id', (req, res) => {
    const product = mockProducts.find(p => p.id == req.params.id);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

router.post('/products', (req, res) => {
    const newProduct = {
        id: mockProducts.length + 1,
        ...req.body,
        stock_status: 'In Stock',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    mockProducts.push(newProduct);
    res.status(201).json({ message: 'Product created successfully', productId: newProduct.id });
});

// Analytics endpoints
router.get('/analytics/dashboard', (req, res) => {
    const totalProducts = mockProducts.length;
    const lowStockProducts = mockProducts.filter(p => p.stock_status === 'Low Stock').length;
    const outOfStockProducts = mockProducts.filter(p => p.stock_status === 'Out of Stock').length;
    const totalInventoryValue = mockProducts.reduce((sum, p) => sum + (p.stock_quantity * p.price), 0);
    
    const topProducts = mockProducts
        .map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            total_sold: Math.floor(Math.random() * 50) + 10,
            total_revenue: (Math.floor(Math.random() * 50) + 10) * p.price
        }))
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, 5);
    
    res.json({
        overview: {
            total_products: totalProducts,
            low_stock_products: lowStockProducts,
            out_of_stock_products: outOfStockProducts,
            total_inventory_value: totalInventoryValue,
            sales_today: 8,
            revenue_today: 2450.75,
            sales_this_month: 156,
            revenue_this_month: 45670.25
        },
        topSellingProducts: topProducts
    });
});

router.get('/analytics/trends', (req, res) => {
    const { period = '30' } = req.query;
    const trends = [];
    
    for (let i = parseInt(period) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        trends.push({
            period: date.toISOString().split('T')[0],
            transactions: Math.floor(Math.random() * 15) + 5,
            items_sold: Math.floor(Math.random() * 30) + 10,
            revenue: Math.floor(Math.random() * 3000) + 1000,
            unique_products: Math.floor(Math.random() * 8) + 3
        });
    }
    
    res.json({ trends });
});

// Stock endpoints
router.get('/stock/low', (req, res) => {
    const lowStockProducts = mockProducts.filter(p => 
        p.stock_status === 'Low Stock' || p.stock_status === 'Out of Stock'
    );
    res.json(lowStockProducts);
});

router.put('/stock/:id', (req, res) => {
    const { quantity, notes = '' } = req.body;
    const product = mockProducts.find(p => p.id == req.params.id);
    
    if (product) {
        const previousStock = product.stock_quantity;
        product.stock_quantity = Math.max(0, previousStock + quantity);
        product.updated_at = new Date().toISOString();
        
        // Update status
        if (product.stock_quantity === 0) {
            product.stock_status = 'Out of Stock';
        } else if (product.stock_quantity <= product.reorder_threshold) {
            product.stock_status = 'Low Stock';
        } else {
            product.stock_status = 'In Stock';
        }
        
        res.json({
            message: 'Stock updated successfully',
            previousStock,
            newStock: product.stock_quantity,
            actualChange: product.stock_quantity - previousStock
        });
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
});

// Sales endpoints
router.get('/sales', (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedSales = mockSales.slice(startIndex, endIndex);
    
    res.json({
        sales: paginatedSales,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(mockSales.length / limit),
            totalItems: mockSales.length,
            itemsPerPage: parseInt(limit)
        }
    });
});

router.post('/sales', (req, res) => {
    const { product_id, quantity_sold, customer_name, notes } = req.body;
    const product = mockProducts.find(p => p.id == product_id);
    
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    
    if (product.stock_quantity < quantity_sold) {
        return res.status(400).json({ 
            message: `Insufficient stock. Available: ${product.stock_quantity}` 
        });
    }
    
    const newSale = {
        id: mockSales.length + 1,
        product_id,
        product_name: product.name,
        quantity_sold,
        unit_price: product.price,
        total_amount: quantity_sold * product.price,
        customer_name: customer_name || 'Walk-in Customer',
        sale_date: new Date().toISOString()
    };
    
    mockSales.push(newSale);
    
    // Update product stock
    product.stock_quantity -= quantity_sold;
    if (product.stock_quantity === 0) {
        product.stock_status = 'Out of Stock';
    } else if (product.stock_quantity <= product.reorder_threshold) {
        product.stock_status = 'Low Stock';
    }
    
    res.status(201).json({
        message: 'Sale recorded successfully',
        saleId: newSale.id,
        productName: product.name,
        quantitySold: quantity_sold,
        totalAmount: newSale.total_amount,
        remainingStock: product.stock_quantity
    });
});

// Advanced Analytics Endpoints

// Executive Dashboard
router.get('/analytics/executive', (req, res) => {
    const totalRevenue = mockSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    const totalCost = mockProducts.reduce((sum, p) => sum + (p.stock_quantity * (p.cost_price || p.price * 0.6)), 0);
    const grossProfit = totalRevenue - (totalRevenue * 0.4); // Assume 40% COGS
    const profitMargin = ((grossProfit / totalRevenue) * 100).toFixed(1);
    
    res.json({
        kpis: {
            totalRevenue: totalRevenue.toFixed(2),
            grossProfit: grossProfit.toFixed(2),
            profitMargin: profitMargin,
            inventoryTurnover: 4.2,
            avgOrderValue: (totalRevenue / mockSales.length).toFixed(2),
            customerRetention: 78.5
        },
        monthlyTrends: generateMonthlyTrends(),
        topMetrics: {
            bestSellingCategory: 'Electronics',
            fastestMovingProduct: 'iPhone 14 Pro',
            slowestMovingProduct: 'MacBook Air M2',
            profitableProduct: 'Dyson V15 Detect'
        }
    });
});

// ABC Analysis
router.get('/analytics/abc-analysis', (req, res) => {
    const productsWithRevenue = mockProducts.map(product => {
        const productSales = mockSales.filter(sale => sale.product_id === product.id);
        const revenue = productSales.reduce((sum, sale) => sum + sale.total_amount, 0);
        const quantity = productSales.reduce((sum, sale) => sum + sale.quantity_sold, 0);
        return { ...product, revenue, quantity };
    });
    
    // Sort by revenue
    productsWithRevenue.sort((a, b) => b.revenue - a.revenue);
    
    const totalRevenue = productsWithRevenue.reduce((sum, p) => sum + p.revenue, 0);
    let cumulativeRevenue = 0;
    
    const abcAnalysis = productsWithRevenue.map(product => {
        cumulativeRevenue += product.revenue;
        const cumulativePercentage = (cumulativeRevenue / totalRevenue) * 100;
        
        let category;
        if (cumulativePercentage <= 80) category = 'A';
        else if (cumulativePercentage <= 95) category = 'B';
        else category = 'C';
        
        return {
            ...product,
            category,
            revenuePercentage: ((product.revenue / totalRevenue) * 100).toFixed(1),
            cumulativePercentage: cumulativePercentage.toFixed(1)
        };
    });
    
    res.json({
        analysis: abcAnalysis,
        summary: {
            categoryA: abcAnalysis.filter(p => p.category === 'A').length,
            categoryB: abcAnalysis.filter(p => p.category === 'B').length,
            categoryC: abcAnalysis.filter(p => p.category === 'C').length
        }
    });
});

// Profit Analysis
router.get('/analytics/profit-analysis', (req, res) => {
    const profitAnalysis = mockProducts.map(product => {
        const productSales = mockSales.filter(sale => sale.product_id === product.id);
        const revenue = productSales.reduce((sum, sale) => sum + sale.total_amount, 0);
        const unitsSold = productSales.reduce((sum, sale) => sum + sale.quantity_sold, 0);
        const costPrice = product.cost_price || product.price * 0.6;
        const totalCost = unitsSold * costPrice;
        const profit = revenue - totalCost;
        const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
        
        return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            revenue: revenue.toFixed(2),
            cost: totalCost.toFixed(2),
            profit: profit.toFixed(2),
            profitMargin: profitMargin,
            unitsSold,
            profitPerUnit: unitsSold > 0 ? (profit / unitsSold).toFixed(2) : 0
        };
    });
    
    res.json({
        products: profitAnalysis.sort((a, b) => b.profit - a.profit),
        totals: {
            totalRevenue: profitAnalysis.reduce((sum, p) => sum + parseFloat(p.revenue), 0).toFixed(2),
            totalCost: profitAnalysis.reduce((sum, p) => sum + parseFloat(p.cost), 0).toFixed(2),
            totalProfit: profitAnalysis.reduce((sum, p) => sum + parseFloat(p.profit), 0).toFixed(2)
        }
    });
});

// Sales Forecasting
router.get('/analytics/forecast', (req, res) => {
    const { months = 6 } = req.query;
    
    // Generate forecast based on historical trends
    const forecast = [];
    const baseRevenue = 15000;
    const growthRate = 0.05; // 5% monthly growth
    
    for (let i = 1; i <= months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        
        const seasonalFactor = 1 + (Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 0.2);
        const randomFactor = 0.9 + (Math.random() * 0.2);
        const projectedRevenue = baseRevenue * Math.pow(1 + growthRate, i) * seasonalFactor * randomFactor;
        
        forecast.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            projectedRevenue: projectedRevenue.toFixed(2),
            confidence: Math.max(95 - (i * 5), 60) // Decreasing confidence over time
        });
    }
    
    res.json({
        forecast,
        methodology: 'Linear regression with seasonal adjustment',
        accuracy: '87%',
        lastUpdated: new Date().toISOString()
    });
});

// Supplier Performance
router.get('/analytics/supplier-performance', (req, res) => {
    const suppliers = [
        {
            id: 1,
            name: 'TechSupply Co.',
            totalOrders: 45,
            onTimeDelivery: 92.3,
            qualityRating: 4.7,
            totalValue: 125000,
            avgLeadTime: 5.2,
            defectRate: 1.2,
            performance: 'Excellent'
        },
        {
            id: 2,
            name: 'Fashion Hub',
            totalOrders: 32,
            onTimeDelivery: 87.5,
            qualityRating: 4.3,
            totalValue: 78000,
            avgLeadTime: 7.1,
            defectRate: 2.8,
            performance: 'Good'
        },
        {
            id: 3,
            name: 'Home Essentials',
            totalOrders: 28,
            onTimeDelivery: 94.1,
            qualityRating: 4.8,
            totalValue: 95000,
            avgLeadTime: 4.8,
            defectRate: 0.9,
            performance: 'Excellent'
        }
    ];
    
    res.json({
        suppliers,
        benchmarks: {
            avgOnTimeDelivery: 91.3,
            avgQualityRating: 4.6,
            avgLeadTime: 5.7,
            avgDefectRate: 1.6
        }
    });
});

// Customer Analytics
router.get('/analytics/customers', (req, res) => {
    const customerData = [
        { segment: 'Premium', count: 45, revenue: 85000, avgOrderValue: 1888.89 },
        { segment: 'Regular', count: 128, revenue: 156000, avgOrderValue: 1218.75 },
        { segment: 'Budget', count: 89, revenue: 67000, avgOrderValue: 752.81 }
    ];
    
    res.json({
        segments: customerData,
        metrics: {
            totalCustomers: customerData.reduce((sum, seg) => sum + seg.count, 0),
            totalRevenue: customerData.reduce((sum, seg) => sum + seg.revenue, 0),
            avgCustomerValue: 1173.48,
            retentionRate: 78.5,
            churnRate: 21.5
        }
    });
});

// Suppliers endpoint
router.get('/suppliers', (req, res) => {
    const mockSuppliers = [
        {
            id: 1,
            name: 'TechSupply Co.',
            contact_person: 'John Smith',
            email: 'john@techsupply.com',
            phone: '+1-555-0101',
            address: '123 Tech Street',
            city: 'San Francisco',
            country: 'USA',
            is_active: true
        },
        {
            id: 2,
            name: 'Fashion Hub',
            contact_person: 'Sarah Johnson',
            email: 'sarah@fashionhub.com',
            phone: '+1-555-0102',
            address: '456 Fashion Ave',
            city: 'New York',
            country: 'USA',
            is_active: true
        }
    ];
    
    res.json({
        suppliers: mockSuppliers,
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: mockSuppliers.length,
            itemsPerPage: 10
        }
    });
});

// Helper function for monthly trends
function generateMonthlyTrends() {
    const trends = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
        const baseRevenue = 15000;
        const seasonalFactor = 1 + (Math.sin((i / 12) * 2 * Math.PI) * 0.3);
        const randomFactor = 0.8 + (Math.random() * 0.4);
        
        trends.push({
            month: months[i],
            revenue: (baseRevenue * seasonalFactor * randomFactor).toFixed(0),
            orders: Math.floor(50 + (Math.random() * 30)),
            customers: Math.floor(80 + (Math.random() * 40))
        });
    }
    
    return trends;
}

module.exports = router;