-- Seed data for Advanced Inventory Management System

USE inventory_management;

-- Insert demo user (password: 'password')
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@inventory.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'admin'),
('manager', 'manager@inventory.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'manager'),
('staff', 'staff@inventory.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'staff');

-- Insert sample products
INSERT INTO products (name, description, sku, category_id, price, cost_price, stock_quantity, reorder_threshold, max_stock_level, unit, barcode) VALUES
('iPhone 14 Pro', 'Latest Apple smartphone with advanced camera system', 'IPH14PRO-128', 1, 999.99, 750.00, 25, 5, 100, 'pcs', '123456789012'),
('Samsung Galaxy S23', 'Premium Android smartphone with excellent display', 'SAM-S23-256', 1, 899.99, 650.00, 18, 5, 80, 'pcs', '123456789013'),
('MacBook Air M2', 'Lightweight laptop with Apple M2 chip', 'MBA-M2-256', 1, 1199.99, 900.00, 12, 3, 50, 'pcs', '123456789014'),
('Dell XPS 13', 'Premium Windows ultrabook', 'DELL-XPS13', 1, 1099.99, 800.00, 8, 3, 40, 'pcs', '123456789015'),
('Sony WH-1000XM4', 'Noise-canceling wireless headphones', 'SONY-WH1000XM4', 1, 349.99, 250.00, 35, 10, 150, 'pcs', '123456789016'),

('Nike Air Max 270', 'Comfortable running shoes', 'NIKE-AM270-10', 2, 149.99, 75.00, 45, 15, 200, 'pairs', '123456789017'),
('Adidas Ultraboost 22', 'High-performance running shoes', 'ADIDAS-UB22-9', 2, 179.99, 90.00, 32, 12, 180, 'pairs', '123456789018'),
('Levi\'s 501 Jeans', 'Classic straight-leg denim jeans', 'LEVIS-501-32W', 2, 89.99, 45.00, 28, 10, 120, 'pcs', '123456789019'),
('Champion Hoodie', 'Comfortable cotton blend hoodie', 'CHAMP-HOOD-L', 2, 59.99, 30.00, 22, 8, 100, 'pcs', '123456789020'),

('The Psychology of Money', 'Personal finance and investing book', 'BOOK-POM-001', 3, 24.99, 12.00, 50, 20, 200, 'pcs', '123456789021'),
('Atomic Habits', 'Self-improvement and habit formation', 'BOOK-AH-001', 3, 19.99, 10.00, 38, 15, 150, 'pcs', '123456789022'),
('Clean Code', 'Programming best practices guide', 'BOOK-CC-001', 3, 49.99, 25.00, 15, 8, 80, 'pcs', '123456789023'),

('Dyson V15 Detect', 'Cordless vacuum cleaner with laser detection', 'DYSON-V15', 4, 749.99, 500.00, 6, 2, 25, 'pcs', '123456789024'),
('Instant Pot Duo 7-in-1', 'Multi-use pressure cooker', 'IP-DUO-6QT', 4, 99.99, 60.00, 20, 8, 60, 'pcs', '123456789025'),
('Philips Hue Starter Kit', 'Smart LED lighting system', 'PHILIPS-HUE-SK', 4, 199.99, 120.00, 14, 5, 50, 'pcs', '123456789026');

-- Insert sample sales data (last 30 days)
INSERT INTO sales (product_id, quantity_sold, unit_price, total_amount, customer_name, sale_date, user_id) VALUES
-- Recent sales (last 7 days)
(1, 2, 999.99, 1999.98, 'John Smith', DATE_SUB(NOW(), INTERVAL 1 DAY), 1),
(5, 1, 349.99, 349.99, 'Sarah Johnson', DATE_SUB(NOW(), INTERVAL 1 DAY), 1),
(6, 3, 149.99, 449.97, 'Mike Wilson', DATE_SUB(NOW(), INTERVAL 2 DAY), 2),
(10, 1, 24.99, 24.99, 'Emily Davis', DATE_SUB(NOW(), INTERVAL 2 DAY), 1),
(2, 1, 899.99, 899.99, 'Robert Brown', DATE_SUB(NOW(), INTERVAL 3 DAY), 2),
(7, 2, 179.99, 359.98, 'Lisa Garcia', DATE_SUB(NOW(), INTERVAL 4 DAY), 1),
(11, 1, 19.99, 19.99, 'David Martinez', DATE_SUB(NOW(), INTERVAL 5 DAY), 1),
(13, 1, 99.99, 99.99, 'Jennifer Lopez', DATE_SUB(NOW(), INTERVAL 6 DAY), 2),
(5, 2, 349.99, 699.98, 'Christopher Lee', DATE_SUB(NOW(), INTERVAL 7 DAY), 1),

-- Older sales (8-30 days ago)
(1, 1, 999.99, 999.99, 'Amanda White', DATE_SUB(NOW(), INTERVAL 10 DAY), 1),
(3, 1, 1199.99, 1199.99, 'Kevin Taylor', DATE_SUB(NOW(), INTERVAL 12 DAY), 2),
(6, 2, 149.99, 299.98, 'Michelle Clark', DATE_SUB(NOW(), INTERVAL 15 DAY), 1),
(8, 1, 89.99, 89.99, 'Daniel Rodriguez', DATE_SUB(NOW(), INTERVAL 18 DAY), 1),
(10, 3, 24.99, 74.97, 'Jessica Martinez', DATE_SUB(NOW(), INTERVAL 20 DAY), 2),
(2, 1, 899.99, 899.99, 'Ryan Anderson', DATE_SUB(NOW(), INTERVAL 22 DAY), 1),
(14, 1, 749.99, 749.99, 'Nicole Thomas', DATE_SUB(NOW(), INTERVAL 25 DAY), 2),
(5, 1, 349.99, 349.99, 'Brandon Jackson', DATE_SUB(NOW(), INTERVAL 28 DAY), 1);

-- Insert stock movements for the sales
INSERT INTO stock_movements (product_id, movement_type, quantity_change, previous_stock, new_stock, reference_type, notes, created_at, created_by) VALUES
(1, 'sale', -2, 27, 25, 'sale', 'Sale to John Smith', DATE_SUB(NOW(), INTERVAL 1 DAY), 1),
(5, 'sale', -1, 36, 35, 'sale', 'Sale to Sarah Johnson', DATE_SUB(NOW(), INTERVAL 1 DAY), 1),
(6, 'sale', -3, 48, 45, 'sale', 'Sale to Mike Wilson', DATE_SUB(NOW(), INTERVAL 2 DAY), 2),
(10, 'sale', -1, 51, 50, 'sale', 'Sale to Emily Davis', DATE_SUB(NOW(), INTERVAL 2 DAY), 1),
(2, 'sale', -1, 19, 18, 'sale', 'Sale to Robert Brown', DATE_SUB(NOW(), INTERVAL 3 DAY), 2);

-- Insert some low stock notifications
INSERT INTO notifications (type, title, message, product_id, created_at) VALUES
('low_stock', 'Low Stock Alert', 'Dell XPS 13 stock is below reorder threshold (8/3).', 4, NOW()),
('low_stock', 'Low Stock Alert', 'Dyson V15 Detect stock is below reorder threshold (6/2).', 14, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('reorder_suggestion', 'Reorder Recommendation', 'Samsung Galaxy S23 has only 12 days of stock remaining. Consider reordering 25 units.', 2, DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Update stock quantities based on sales
UPDATE products SET stock_quantity = stock_quantity - (
    SELECT COALESCE(SUM(quantity_sold), 0) 
    FROM sales 
    WHERE sales.product_id = products.id
) WHERE id IN (SELECT DISTINCT product_id FROM sales);