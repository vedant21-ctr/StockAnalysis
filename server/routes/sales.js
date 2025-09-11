const express = require('express');
const router = express.Router();
const { executeQuery, executeTransaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Record a new sale
router.post('/', async (req, res) => {
  try {
    const { product_id, quantity_sold, customer_name, notes } = req.body;

    if (!product_id || !quantity_sold || quantity_sold <= 0) {
      return res.status(400).json({ 
        message: 'Product ID and valid quantity are required' 
      });
    }

    // Get product details and check stock
    const productQuery = `
      SELECT id, name, price, stock_quantity 
      FROM products 
      WHERE id = ? AND is_active = TRUE
    `;
    const [product] = await executeQuery(productQuery, [product_id]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock_quantity < quantity_sold) {
      return res.status(400).json({ 
        message: `Insufficient stock. Available: ${product.stock_quantity}` 
      });
    }

    const unit_price = product.price;
    const total_amount = unit_price * quantity_sold;
    const new_stock = product.stock_quantity - quantity_sold;

    const queries = [
      // Record the sale
      {
        query: `
          INSERT INTO sales (
            product_id, quantity_sold, unit_price, total_amount,
            customer_name, user_id, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [product_id, quantity_sold, unit_price, total_amount, customer_name, 1, notes]
      },
      // Update product stock
      {
        query: 'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        params: [new_stock, product_id]
      },
      // Record stock movement
      {
        query: `
          INSERT INTO stock_movements (
            product_id, movement_type, quantity_change, 
            previous_stock, new_stock, notes, created_by
          ) VALUES (?, 'sale', ?, ?, ?, ?, ?)
        `,
        params: [
          product_id, 
          -quantity_sold, 
          product.stock_quantity, 
          new_stock, 
          `Sale to ${customer_name || 'Customer'}`, 
          1
        ]
      }
    ];

    const results = await executeTransaction(queries);
    const saleId = results[0].insertId;

    res.status(201).json({
      message: 'Sale recorded successfully',
      saleId,
      productName: product.name,
      quantitySold: quantity_sold,
      totalAmount: total_amount,
      remainingStock: new_stock
    });
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(500).json({ message: 'Failed to record sale' });
  }
});

// Get sales history with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      product_id, 
      start_date, 
      end_date,
      customer_name 
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (product_id) {
      whereClause += ' AND s.product_id = ?';
      params.push(product_id);
    }

    if (start_date) {
      whereClause += ' AND DATE(s.sale_date) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND DATE(s.sale_date) <= ?';
      params.push(end_date);
    }

    if (customer_name) {
      whereClause += ' AND s.customer_name LIKE ?';
      params.push(`%${customer_name}%`);
    }

    const query = `
      SELECT 
        s.*,
        p.name as product_name,
        p.sku,
        u.username as sold_by
      FROM sales s
      LEFT JOIN products p ON s.product_id = p.id
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY s.sale_date DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);
    const sales = await executeQuery(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sales s
      ${whereClause}
    `;
    const countParams = params.slice(0, -2);
    const [{ total }] = await executeQuery(countQuery, countParams);

    res.json({
      sales,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ message: 'Failed to fetch sales' });
  }
});

// Get sales summary/statistics
router.get('/summary', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    const queries = {
      totalSales: `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(quantity_sold) as total_items_sold,
          SUM(total_amount) as total_revenue
        FROM sales 
        WHERE sale_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `,
      topProducts: `
        SELECT 
          p.id,
          p.name,
          p.sku,
          SUM(s.quantity_sold) as total_sold,
          SUM(s.total_amount) as total_revenue,
          COUNT(s.id) as transaction_count
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY p.id, p.name, p.sku
        ORDER BY total_sold DESC
        LIMIT 10
      `,
      dailySales: `
        SELECT 
          DATE(sale_date) as sale_date,
          COUNT(*) as transactions,
          SUM(quantity_sold) as items_sold,
          SUM(total_amount) as revenue
        FROM sales
        WHERE sale_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(sale_date)
        ORDER BY sale_date DESC
      `
    };

    const [totalSales] = await executeQuery(queries.totalSales, [period]);
    const topProducts = await executeQuery(queries.topProducts, [period]);
    const dailySales = await executeQuery(queries.dailySales, [period]);

    res.json({
      period: `${period} days`,
      summary: totalSales,
      topProducts,
      dailySales
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({ message: 'Failed to fetch sales summary' });
  }
});

// Get product sales analytics
router.get('/product/:productId/analytics', async (req, res) => {
  try {
    const { productId } = req.params;
    const { days = 30 } = req.query;

    const queries = {
      productInfo: `
        SELECT id, name, sku, price, stock_quantity
        FROM products 
        WHERE id = ? AND is_active = TRUE
      `,
      salesTrend: `
        SELECT 
          DATE(sale_date) as date,
          SUM(quantity_sold) as quantity,
          SUM(total_amount) as revenue,
          COUNT(*) as transactions
        FROM sales
        WHERE product_id = ? AND sale_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(sale_date)
        ORDER BY date ASC
      `,
      totalStats: `
        SELECT 
          COUNT(*) as total_transactions,
          SUM(quantity_sold) as total_quantity,
          SUM(total_amount) as total_revenue,
          AVG(quantity_sold) as avg_quantity_per_sale,
          MIN(sale_date) as first_sale,
          MAX(sale_date) as last_sale
        FROM sales
        WHERE product_id = ? AND sale_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `
    };

    const [product] = await executeQuery(queries.productInfo, [productId]);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const salesTrend = await executeQuery(queries.salesTrend, [productId, days]);
    const [stats] = await executeQuery(queries.totalStats, [productId, days]);

    res.json({
      product,
      period: `${days} days`,
      salesTrend,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({ message: 'Failed to fetch product analytics' });
  }
});

module.exports = router;