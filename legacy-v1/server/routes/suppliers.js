const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE is_active = TRUE';
    const params = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR contact_person LIKE ? OR email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const query = `
      SELECT * FROM suppliers
      ${whereClause}
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);
    const suppliers = await executeQuery(query, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM suppliers ${whereClause}`;
    const countParams = params.slice(0, -2);
    const [{ total }] = await executeQuery(countQuery, countParams);

    res.json({
      suppliers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'Failed to fetch suppliers' });
  }
});

// Get single supplier
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'SELECT * FROM suppliers WHERE id = ? AND is_active = TRUE';
    const [supplier] = await executeQuery(query, [id]);

    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ message: 'Failed to fetch supplier' });
  }
});

// Create new supplier
router.post('/', async (req, res) => {
  try {
    const {
      name,
      contact_person,
      email,
      phone,
      address,
      city,
      country
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    const query = `
      INSERT INTO suppliers (
        name, contact_person, email, phone, address, city, country
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [
      name, contact_person, email, phone, address, city, country
    ]);

    res.status(201).json({
      message: 'Supplier created successfully',
      supplierId: result.insertId
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ message: 'Failed to create supplier' });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    delete updateFields.id;
    delete updateFields.created_at;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const setClause = Object.keys(updateFields)
      .map(field => `${field} = ?`)
      .join(', ');
    
    const values = Object.values(updateFields);
    values.push(id);

    const query = `
      UPDATE suppliers 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND is_active = TRUE
    `;

    const result = await executeQuery(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json({ message: 'Supplier updated successfully' });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'Failed to update supplier' });
  }
});

// Delete supplier (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'UPDATE suppliers SET is_active = FALSE WHERE id = ?';
    const result = await executeQuery(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'Failed to delete supplier' });
  }
});

module.exports = router;