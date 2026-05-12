const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/dashboard', async (req, res) => {
  try {
    const queries = {
      overview: `
        SELECT 
          (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as total_products,
          (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND stock_quantity <= reorder_threshold) as low_stock_products,
          (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND stock_quantity = 0) as out_of_stock_products,
          (SELECT COALESCE(SUM(stock_quantity * price), 0) FROM products WHERE is_active = TRUE) as total_inventory_value
      `,
      recentSales: `
        SELECT 
          COUNT(*) as sales_today,
          COALESCE(SUM(total_amount), 0) as revenue_today
        FROM sales 
        WHERE DATE(sale_date) = CURDATE()
      `,
      monthlySales: `
        SELECT 
          COUNT(*) as sales_this_month,
          COALESCE(SUM(total_amount), 0) as revenue_this_month
        FROM sales 
        WHERE YEAR(sale_date) = YEAR(CURDATE()) 
          AND MONTH(sale_date) = MONTH(CURDATE())
      `,
      topSellingProducts: `
        SELECT 
          p.id,
          p.name,
          p.sku,
          SUM(s.quantity_sold) as total_sold,
          SUM(s.total_amount) as total_revenue
        FROM sales s
        JOIN products p ON s.product_id = p.id
        WHERE s.sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY p.id, p.name, p.sku
        ORDER BY total_sold DESC
        LIMIT 5
      `
    };

    const [overview] = await executeQuery(queries.overview);
    const [recentSales] = await executeQuery(queries.recentSales);
    const [monthlySales] = await executeQuery(queries.monthlySales);
    const topProducts = await executeQuery(queries.topSellingProducts);

    res.json({
      overview: {
        ...overview,
        ...recentSales,
        ...monthlySales
      },
      topSellingProducts: topProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// Get sales trends
router.get('/trends', async (req, res) => {
  try {
    const { period = '30', groupBy = 'day' } = req.query;

    let dateFormat, intervalDays;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00:00';
        intervalDays = 1;
        break;
      case 'week':
        dateFormat = '%Y-%u';
        intervalDays = 84; // 12 weeks
        break;
      case 'month':
        dateFormat = '%Y-%m';
        intervalDays = 365;
        break;
      default:
        dateFormat = '%Y-%m-%d';
        intervalDays = parseInt(period);
    }

    const query = `
      SELECT 
        DATE_FORMAT(sale_date, '${dateFormat}') as period,
        COUNT(*) as transactions,
        SUM(quantity_sold) as items_sold,
        SUM(total_amount) as revenue,
        COUNT(DISTINCT product_id) as unique_products
      FROM sales
      WHERE sale_date >= DATE_SUB(NOW(), INTERVAL ${intervalDays} DAY)
      GROUP BY DATE_FORMAT(sale_date, '${dateFormat}')
      ORDER BY period ASC
    `;

    const trends = await executeQuery(query);
    res.json({ trends, period: intervalDays, groupBy });
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({ message: 'Failed to fetch sales trends' });
  }
});

// Get inventory analytics
router.get('/inventory', async (req, res) => {
  try {
    const queries = {
      stockDistribution: `
        SELECT 
          CASE 
            WHEN stock_quantity = 0 THEN 'Out of Stock'
            WHEN stock_quantity <= reorder_threshold THEN 'Low Stock'
            WHEN stock_quantity <= reorder_threshold * 2 THEN 'Medium Stock'
            ELSE 'High Stock'
          END as stock_level,
          COUNT(*) as product_count,
          SUM(stock_quantity * price) as total_value
        FROM products 
        WHERE is_active = TRUE
        GROUP BY stock_level
      `,
      categoryAnalysis: `
        SELECT 
          c.name as category,
          COUNT(p.id) as product_count,
          SUM(p.stock_quantity) as total_stock,
          SUM(p.stock_quantity * p.price) as total_value,
          AVG(p.price) as avg_price
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = TRUE
        GROUP BY c.id, c.name
        ORDER BY total_value DESC
      `,
      slowMovingProducts: `
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.stock_quantity,
          p.price,
          COALESCE(SUM(s.quantity_sold), 0) as sold_last_30_days,
          DATEDIFF(NOW(), MAX(s.sale_date)) as days_since_last_sale
        FROM products p
        LEFT JOIN sales s ON p.id = s.product_id 
          AND s.sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        WHERE p.is_active = TRUE AND p.stock_quantity > 0
        GROUP BY p.id, p.name, p.sku, p.stock_quantity, p.price
        HAVING sold_last_30_days = 0 OR days_since_last_sale > 30
        ORDER BY p.stock_quantity * p.price DESC
        LIMIT 10
      `
    };

    const stockDistribution = await executeQuery(queries.stockDistribution);
    const categoryAnalysis = await executeQuery(queries.categoryAnalysis);
    const slowMovingProducts = await executeQuery(queries.slowMovingProducts);

    res.json({
      stockDistribution,
      categoryAnalysis,
      slowMovingProducts
    });
  } catch (error) {
    console.error('Error fetching inventory analytics:', error);
    res.status(500).json({ message: 'Failed to fetch inventory analytics' });
  }
});

// Get predictive analytics
router.get('/predictions', async (req, res) => {
  try {
    const { productId } = req.query;
    
    let whereClause = 'WHERE p.is_active = TRUE';
    const params = [];
    
    if (productId) {
      whereClause += ' AND p.id = ?';
      params.push(productId);
    }

    const query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.stock_quantity,
        p.reorder_threshold,
        
        -- Calculate average daily sales over last 30 days
        COALESCE(AVG(daily_sales.quantity), 0) as avg_daily_sales,
        
        -- Calculate days of stock remaining
        CASE 
          WHEN COALESCE(AVG(daily_sales.quantity), 0) > 0 THEN 
            FLOOR(p.stock_quantity / AVG(daily_sales.quantity))
          ELSE 999
        END as days_of_stock_remaining,
        
        -- Suggest reorder quantity based on sales velocity
        CASE 
          WHEN COALESCE(AVG(daily_sales.quantity), 0) > 0 THEN 
            GREATEST(
              p.reorder_threshold,
              CEIL(AVG(daily_sales.quantity) * 21) -- 3 weeks supply
            )
          ELSE p.reorder_threshold
        END as suggested_reorder_quantity,
        
        -- Calculate reorder urgency
        CASE 
          WHEN p.stock_quantity = 0 THEN 'Critical'
          WHEN p.stock_quantity <= p.reorder_threshold THEN 'High'
          WHEN COALESCE(AVG(daily_sales.quantity), 0) > 0 
            AND p.stock_quantity / AVG(daily_sales.quantity) <= 7 THEN 'Medium'
          ELSE 'Low'
        END as reorder_urgency,
        
        -- Sales trend (comparing last 15 days vs previous 15 days)
        CASE 
          WHEN recent_avg.avg_recent > older_avg.avg_older * 1.2 THEN 'Increasing'
          WHEN recent_avg.avg_recent < older_avg.avg_older * 0.8 THEN 'Decreasing'
          ELSE 'Stable'
        END as sales_trend
        
      FROM products p
      
      -- Daily sales for last 30 days
      LEFT JOIN (
        SELECT 
          product_id,
          DATE(sale_date) as sale_date,
          SUM(quantity_sold) as quantity
        FROM sales
        WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY product_id, DATE(sale_date)
      ) daily_sales ON p.id = daily_sales.product_id
      
      -- Recent sales average (last 15 days)
      LEFT JOIN (
        SELECT 
          product_id,
          AVG(quantity_sold) as avg_recent
        FROM sales
        WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 15 DAY)
        GROUP BY product_id
      ) recent_avg ON p.id = recent_avg.product_id
      
      -- Older sales average (16-30 days ago)
      LEFT JOIN (
        SELECT 
          product_id,
          AVG(quantity_sold) as avg_older
        FROM sales
        WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND sale_date < DATE_SUB(NOW(), INTERVAL 15 DAY)
        GROUP BY product_id
      ) older_avg ON p.id = older_avg.product_id
      
      ${whereClause}
      GROUP BY p.id, p.name, p.sku, p.stock_quantity, p.reorder_threshold,
               recent_avg.avg_recent, older_avg.avg_older
      HAVING days_of_stock_remaining <= 30 OR reorder_urgency IN ('Critical', 'High')
      ORDER BY 
        CASE reorder_urgency
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          ELSE 4
        END,
        days_of_stock_remaining ASC
    `;

    const predictions = await executeQuery(query, params);
    res.json(predictions);
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ message: 'Failed to generate predictions' });
  }
});

// Get profit analysis
router.get('/profit', async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.price as selling_price,
        p.cost_price,
        (p.price - COALESCE(p.cost_price, 0)) as profit_per_unit,
        CASE 
          WHEN p.cost_price > 0 THEN 
            ROUND(((p.price - p.cost_price) / p.cost_price) * 100, 2)
          ELSE NULL
        END as profit_margin_percent,
        
        SUM(s.quantity_sold) as units_sold,
        SUM(s.total_amount) as total_revenue,
        SUM(s.quantity_sold * COALESCE(p.cost_price, 0)) as total_cost,
        SUM(s.total_amount) - SUM(s.quantity_sold * COALESCE(p.cost_price, 0)) as total_profit
        
      FROM products p
      LEFT JOIN sales s ON p.id = s.product_id 
        AND s.sale_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      WHERE p.is_active = TRUE
      GROUP BY p.id, p.name, p.sku, p.price, p.cost_price
      HAVING units_sold > 0
      ORDER BY total_profit DESC
    `;

    const profitAnalysis = await executeQuery(query, [period]);
    
    // Calculate summary
    const totalRevenue = profitAnalysis.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
    const totalCost = profitAnalysis.reduce((sum, item) => sum + (item.total_cost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const overallMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0;

    res.json({
      period: `${period} days`,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        overallMargin: parseFloat(overallMargin)
      },
      productProfitability: profitAnalysis
    });
  } catch (error) {
    console.error('Error fetching profit analysis:', error);
    res.status(500).json({ message: 'Failed to fetch profit analysis' });
  }
});

module.exports = router;