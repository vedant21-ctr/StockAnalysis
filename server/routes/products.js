const express = require('express');
const router = express.Router();
const { executeQuery, executeTransaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all products with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '', 
      status = 'all',
      sortBy = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE p.is_active = TRUE';
    const params = [];

    // Add search filter
    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add category filter
    if (category) {
      whereClause += ' AND p.category_id = ?';
      params.push(category);
    }

    // Add stock status filter
    if (status === 'low') {
      whereClause += ' AND p.stock_quantity <= p.reorder_threshold';
    } else if (status === 'out') {
      whereClause += ' AND p.stock_quantity = 0';
    }

    // Validate sort parameters
    const validSortFields = ['name', 'sku', 'price', 'stock_quantity', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        CASE 
          WHEN p.stock_quantity = 0 THEN 'Out of Stock'
          WHEN p.stock_quantity <= p.reorder_threshold THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.${sortField} ${order}
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);
    const products = await executeQuery(query, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;
    const countParams = params.slice(0, -2); // Remove limit and offset
    const [{ total }] = await executeQuery(countQuery, countParams);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        CASE 
          WHEN p.stock_quantity = 0 THEN 'Out of Stock'
          WHEN p.stock_quantity <= p.reorder_threshold THEN 'Low Stock'
          ELSE 'In Stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_active = TRUE
    `;

    const products = await executeQuery(query, [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Create new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      sku,
      category_id,
      price,
      cost_price,
      stock_quantity = 0,
      reorder_threshold = 10,
      max_stock_level = 1000,
      unit = 'pcs',
      barcode,
      image_url
    } = req.body;

    // Validate required fields
    if (!name || !sku || !price) {
      return res.status(400).json({ 
        message: 'Name, SKU, and price are required' 
      });
    }

    const query = `
      INSERT INTO products (
        name, description, sku, category_id, price, cost_price,
        stock_quantity, reorder_threshold, max_stock_level, unit,
        barcode, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      name, description, sku, category_id, price, cost_price,
      stock_quantity, reorder_threshold, max_stock_level, unit,
      barcode, image_url
    ];

    const result = await executeQuery(query, params);

    // Log initial stock if any
    if (stock_quantity > 0) {
      const stockMovementQuery = `
        INSERT INTO stock_movements (
          product_id, movement_type, quantity_change, 
          previous_stock, new_stock, notes, created_by
        ) VALUES (?, 'adjustment', ?, 0, ?, 'Initial stock', ?)
      `;
      
      await executeQuery(stockMovementQuery, [
        result.insertId, stock_quantity, stock_quantity, 1
      ]);
    }

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'SKU already exists' });
    } else {
      res.status(500).json({ message: 'Failed to create product' });
    }
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateFields.id;
    delete updateFields.created_at;
    delete updateFields.stock_quantity; // Use separate endpoint for stock updates

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const setClause = Object.keys(updateFields)
      .map(field => `${field} = ?`)
      .join(', ');
    
    const values = Object.values(updateFields);
    values.push(id);

    const query = `
      UPDATE products 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_active = TRUE
    `;

    const result = await executeQuery(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'SKU already exists' });
    } else {
      res.status(500).json({ message: 'Failed to update product' });
    }
  }
});

// Soft delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'UPDATE products SET is_active = FALSE WHERE id = ?';
    const result = await executeQuery(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

module.exports = router;