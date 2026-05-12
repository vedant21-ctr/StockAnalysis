const express = require('express');
const router = express.Router();
const { executeQuery, executeTransaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get low stock products
router.get('/low', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.stock_quantity,
        p.reorder_threshold,
        p.max_stock_level,
        c.name as category_name,
        CASE 
          WHEN p.stock_quantity = 0 THEN 'Out of Stock'
          WHEN p.stock_quantity <= p.reorder_threshold THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status,
        (p.reorder_threshold - p.stock_quantity) as shortage_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE 
        AND p.stock_quantity <= p.reorder_threshold
      ORDER BY p.stock_quantity ASC, shortage_quantity DESC
    `;

    const lowStockProducts = await executeQuery(query);
    res.json(lowStockProducts);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ message: 'Failed to fetch low stock products' });
  }
});

// Update stock quantity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, movement_type = 'adjustment', notes = '' } = req.body;

    if (typeof quantity !== 'number') {
      return res.status(400).json({ message: 'Quantity must be a number' });
    }

    // Get current stock
    const currentStockQuery = 'SELECT stock_quantity FROM products WHERE id = ? AND is_active = TRUE';
    const [product] = await executeQuery(currentStockQuery, [id]);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const previousStock = product.stock_quantity;
    const newStock = Math.max(0, previousStock + quantity); // Prevent negative stock
    const actualChange = newStock - previousStock;

    const queries = [
      {
        query: 'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        params: [newStock, id]
      },
      {
        query: `
          INSERT INTO stock_movements (
            product_id, movement_type, quantity_change, 
            previous_stock, new_stock, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        params: [id, movement_type, actualChange, previousStock, newStock, notes, 1]
      }
    ];

    await executeTransaction(queries);

    res.json({
      message: 'Stock updated successfully',
      previousStock,
      newStock,
      actualChange
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Failed to update stock' });
  }
});

// Get stock movements history
router.get('/movements/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        sm.*,
        u.username as created_by_name,
        p.name as product_name,
        p.sku
      FROM stock_movements sm
      LEFT JOIN users u ON sm.created_by = u.id
      LEFT JOIN products p ON sm.product_id = p.id
      WHERE sm.product_id = ?
      ORDER BY sm.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const movements = await executeQuery(query, [productId, parseInt(limit), offset]);

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM stock_movements WHERE product_id = ?';
    const [{ total }] = await executeQuery(countQuery, [productId]);

    res.json({
      movements,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ message: 'Failed to fetch stock movements' });
  }
});

// Get reorder suggestions
router.get('/reorder-suggestions', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.stock_quantity,
        p.reorder_threshold,
        p.max_stock_level,
        c.name as category_name,
        COALESCE(AVG(s.quantity_sold), 0) as avg_daily_sales,
        COALESCE(SUM(s.quantity_sold), 0) as total_sales_30d,
        CASE 
          WHEN AVG(s.quantity_sold) > 0 THEN 
            CEIL(p.stock_quantity / AVG(s.quantity_sold))
          ELSE 999
        END as days_of_stock,
        CASE 
          WHEN AVG(s.quantity_sold) > 0 THEN 
            GREATEST(
              p.reorder_threshold * 2,
              CEIL(AVG(s.quantity_sold) * 14)
            )
          ELSE p.reorder_threshold
        END as suggested_order_quantity
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sales s ON p.id = s.product_id 
        AND s.sale_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      WHERE p.is_active = TRUE 
        AND p.stock_quantity <= p.reorder_threshold
      GROUP BY p.id, p.name, p.sku, p.stock_quantity, p.reorder_threshold, 
               p.max_stock_level, c.name
      HAVING days_of_stock <= 14
      ORDER BY days_of_stock ASC, total_sales_30d DESC
    `;

    const suggestions = await executeQuery(query);
    res.json(suggestions);
  } catch (error) {
    console.error('Error generating reorder suggestions:', error);
    res.status(500).json({ message: 'Failed to generate reorder suggestions' });
  }
});

// Bulk stock update
router.post('/bulk-update', async (req, res) => {
  try {
    const { updates } = req.body; // Array of {productId, quantity, notes}

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates array is required' });
    }

    const queries = [];
    const results = [];

    for (const update of updates) {
      const { productId, quantity, notes = 'Bulk update' } = update;

      // Get current stock
      const [product] = await executeQuery(
        'SELECT stock_quantity, name FROM products WHERE id = ? AND is_active = TRUE',
        [productId]
      );

      if (product) {
        const previousStock = product.stock_quantity;
        const newStock = Math.max(0, previousStock + quantity);
        const actualChange = newStock - previousStock;

        queries.push(
          {
            query: 'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            params: [newStock, productId]
          },
          {
            query: `
              INSERT INTO stock_movements (
                product_id, movement_type, quantity_change, 
                previous_stock, new_stock, notes, created_by
              ) VALUES (?, 'adjustment', ?, ?, ?, ?, ?)
            `,
            params: [productId, actualChange, previousStock, newStock, notes, 1]
          }
        );

        results.push({
          productId,
          productName: product.name,
          previousStock,
          newStock,
          actualChange
        });
      }
    }

    if (queries.length > 0) {
      await executeTransaction(queries);
    }

    res.json({
      message: 'Bulk stock update completed',
      updatedProducts: results.length / 2, // Divide by 2 because we have 2 queries per product
      results
    });
  } catch (error) {
    console.error('Error in bulk stock update:', error);
    res.status(500).json({ message: 'Failed to update stock in bulk' });
  }
});

module.exports = router;