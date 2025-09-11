const cron = require('node-cron');
const { executeQuery, executeTransaction } = require('../config/database');

// Predictive stock analysis job
const analyzeStockLevels = async () => {
  try {
    console.log('🔍 Starting stock analysis job...');

    // Get products that need analysis
    const productsQuery = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.stock_quantity,
        p.reorder_threshold,
        p.max_stock_level,
        
        -- Calculate sales velocity (last 30 days)
        COALESCE(AVG(daily_sales.quantity), 0) as avg_daily_sales,
        COALESCE(SUM(recent_sales.quantity_sold), 0) as sales_last_7_days,
        COALESCE(SUM(monthly_sales.quantity_sold), 0) as sales_last_30_days,
        
        -- Calculate trend (last 15 days vs previous 15 days)
        COALESCE(AVG(recent_trend.quantity_sold), 0) as recent_avg,
        COALESCE(AVG(older_trend.quantity_sold), 0) as older_avg
        
      FROM products p
      
      -- Daily sales aggregation for velocity calculation
      LEFT JOIN (
        SELECT 
          product_id,
          DATE(sale_date) as sale_date,
          SUM(quantity_sold) as quantity
        FROM sales
        WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY product_id, DATE(sale_date)
      ) daily_sales ON p.id = daily_sales.product_id
      
      -- Recent sales (last 7 days)
      LEFT JOIN sales recent_sales ON p.id = recent_sales.product_id 
        AND recent_sales.sale_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      -- Monthly sales (last 30 days)
      LEFT JOIN sales monthly_sales ON p.id = monthly_sales.product_id 
        AND monthly_sales.sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      
      -- Recent trend (last 15 days)
      LEFT JOIN sales recent_trend ON p.id = recent_trend.product_id 
        AND recent_trend.sale_date >= DATE_SUB(NOW(), INTERVAL 15 DAY)
      
      -- Older trend (16-30 days ago)
      LEFT JOIN sales older_trend ON p.id = older_trend.product_id 
        AND older_trend.sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND older_trend.sale_date < DATE_SUB(NOW(), INTERVAL 15 DAY)
      
      WHERE p.is_active = TRUE
      GROUP BY p.id, p.name, p.sku, p.stock_quantity, p.reorder_threshold, p.max_stock_level
    `;

    const products = await executeQuery(productsQuery);
    console.log(`📊 Analyzing ${products.length} products...`);

    const predictions = [];
    const notifications = [];

    for (const product of products) {
      const analysis = analyzeProduct(product);
      
      if (analysis.needsPrediction) {
        predictions.push({
          product_id: product.id,
          predicted_demand: analysis.predictedDemand,
          suggested_reorder_quantity: analysis.suggestedQuantity,
          suggested_reorder_date: analysis.suggestedDate,
          confidence_score: analysis.confidence
        });
      }

      // Generate notifications for critical items
      if (analysis.notifications.length > 0) {
        notifications.push(...analysis.notifications.map(notif => ({
          ...notif,
          product_id: product.id
        })));
      }
    }

    // Save predictions to database
    if (predictions.length > 0) {
      await savePredictions(predictions);
      console.log(`💡 Generated ${predictions.length} stock predictions`);
    }

    // Create notifications
    if (notifications.length > 0) {
      await createNotifications(notifications);
      console.log(`🔔 Created ${notifications.length} notifications`);
    }

    console.log('✅ Stock analysis completed successfully');
  } catch (error) {
    console.error('❌ Stock analysis failed:', error);
  }
};

// Analyze individual product
const analyzeProduct = (product) => {
  const {
    id,
    name,
    stock_quantity,
    reorder_threshold,
    max_stock_level,
    avg_daily_sales,
    sales_last_7_days,
    sales_last_30_days,
    recent_avg,
    older_avg
  } = product;

  const analysis = {
    needsPrediction: false,
    predictedDemand: 0,
    suggestedQuantity: 0,
    suggestedDate: null,
    confidence: 0,
    notifications: []
  };

  // Calculate days of stock remaining
  const daysOfStock = avg_daily_sales > 0 ? Math.floor(stock_quantity / avg_daily_sales) : 999;

  // Determine sales trend
  let trendMultiplier = 1;
  if (recent_avg > 0 && older_avg > 0) {
    const trendRatio = recent_avg / older_avg;
    if (trendRatio > 1.2) {
      trendMultiplier = 1.3; // Increasing trend
    } else if (trendRatio < 0.8) {
      trendMultiplier = 0.7; // Decreasing trend
    }
  }

  // Calculate confidence based on data availability
  let confidence = 0.5; // Base confidence
  if (sales_last_30_days > 0) confidence += 0.2;
  if (sales_last_7_days > 0) confidence += 0.2;
  if (recent_avg > 0 && older_avg > 0) confidence += 0.1;

  // Predict demand for next 30 days
  const predictedDemand = Math.ceil(avg_daily_sales * 30 * trendMultiplier);

  // Calculate suggested reorder quantity
  const leadTimeDays = 7; // Assume 7 days lead time
  const safetyStock = Math.ceil(avg_daily_sales * leadTimeDays);
  const suggestedQuantity = Math.min(
    Math.max(
      reorder_threshold * 2,
      predictedDemand + safetyStock
    ),
    max_stock_level
  );

  // Calculate suggested reorder date
  const reorderPoint = reorder_threshold + safetyStock;
  const daysUntilReorder = avg_daily_sales > 0 ? 
    Math.max(0, Math.floor((stock_quantity - reorderPoint) / avg_daily_sales)) : 0;
  
  const suggestedDate = new Date();
  suggestedDate.setDate(suggestedDate.getDate() + daysUntilReorder);

  // Determine if prediction is needed
  analysis.needsPrediction = stock_quantity <= reorder_threshold || daysOfStock <= 14;
  analysis.predictedDemand = predictedDemand;
  analysis.suggestedQuantity = suggestedQuantity;
  analysis.suggestedDate = suggestedDate.toISOString().split('T')[0];
  analysis.confidence = Math.min(confidence, 1.0);

  // Generate notifications
  if (stock_quantity === 0) {
    analysis.notifications.push({
      type: 'stock_out',
      title: 'Product Out of Stock',
      message: `${name} is completely out of stock and needs immediate restocking.`
    });
  } else if (stock_quantity <= reorder_threshold) {
    analysis.notifications.push({
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${name} stock is below reorder threshold (${stock_quantity}/${reorder_threshold}).`
    });
  }

  if (daysOfStock <= 7 && daysOfStock > 0) {
    analysis.notifications.push({
      type: 'reorder_suggestion',
      title: 'Reorder Recommendation',
      message: `${name} has only ${daysOfStock} days of stock remaining. Consider reordering ${suggestedQuantity} units.`
    });
  }

  return analysis;
};

// Save predictions to database
const savePredictions = async (predictions) => {
  try {
    // Clear old predictions for these products
    const productIds = predictions.map(p => p.product_id);
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      await executeQuery(
        `DELETE FROM stock_predictions WHERE product_id IN (${placeholders})`,
        productIds
      );
    }

    // Insert new predictions
    const queries = predictions.map(pred => ({
      query: `
        INSERT INTO stock_predictions (
          product_id, predicted_demand, suggested_reorder_quantity,
          suggested_reorder_date, confidence_score
        ) VALUES (?, ?, ?, ?, ?)
      `,
      params: [
        pred.product_id,
        pred.predicted_demand,
        pred.suggested_reorder_quantity,
        pred.suggested_reorder_date,
        pred.confidence_score
      ]
    }));

    await executeTransaction(queries);
  } catch (error) {
    console.error('Error saving predictions:', error);
    throw error;
  }
};

// Create notifications
const createNotifications = async (notifications) => {
  try {
    const queries = notifications.map(notif => ({
      query: `
        INSERT INTO notifications (type, title, message, product_id)
        VALUES (?, ?, ?, ?)
      `,
      params: [notif.type, notif.title, notif.message, notif.product_id]
    }));

    await executeTransaction(queries);
  } catch (error) {
    console.error('Error creating notifications:', error);
    throw error;
  }
};

// Clean up old notifications (keep last 100 per type)
const cleanupNotifications = async () => {
  try {
    const query = `
      DELETE FROM notifications 
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id FROM notifications 
          ORDER BY created_at DESC 
          LIMIT 100
        ) as keep_notifications
      )
    `;
    
    await executeQuery(query);
    console.log('🧹 Cleaned up old notifications');
  } catch (error) {
    console.error('Error cleaning notifications:', error);
  }
};

// Schedule jobs
console.log('📅 Scheduling stock analysis jobs...');

// Run stock analysis every day at 2 AM
cron.schedule('0 2 * * *', () => {
  console.log('⏰ Running scheduled stock analysis...');
  analyzeStockLevels();
});

// Clean up notifications weekly (Sunday at 3 AM)
cron.schedule('0 3 * * 0', () => {
  console.log('⏰ Running notification cleanup...');
  cleanupNotifications();
});

// Run initial analysis on startup (after 30 seconds)
setTimeout(() => {
  console.log('🚀 Running initial stock analysis...');
  analyzeStockLevels();
}, 30000);

module.exports = {
  analyzeStockLevels,
  analyzeProduct,
  cleanupNotifications
};