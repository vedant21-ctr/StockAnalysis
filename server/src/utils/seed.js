const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

// Models
const User = require('../models/User');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Sale = require('../models/Sale');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const suppliers = [
    {
        name: 'TechSupply global',
        contactPerson: 'John Wick',
        email: 'john@techsupply.com',
        phone: '+1-555-0101',
        address: '123 Tech Lane, SF',
        qualityRating: 4.8,
        avgLeadTime: 3,
        onTimeDelivery: 98
    },
    {
        name: 'Fashion Matrix',
        contactPerson: 'Sarah Connor',
        email: 'sarah@fashion.com',
        phone: '+1-555-0102',
        address: '456 Trend Blvd, NYC',
        qualityRating: 4.2,
        avgLeadTime: 7,
        onTimeDelivery: 89
    },
    {
        name: 'Global Logistics co',
        contactPerson: 'Bruce Wayne',
        email: 'bruce@gotham.com',
        phone: '+1-555-0103',
        address: '789 Manor Drive',
        qualityRating: 4.9,
        avgLeadTime: 2,
        onTimeDelivery: 99
    }
];

const products = [
    { name: 'iPhone 15 Pro', sku: 'IPH15P-128', category: 'Electronics', price: 1099, costPrice: 800, stockQuantity: 45, reorderThreshold: 10 },
    { name: 'MacBook Air M2', sku: 'MBA-M2-256', category: 'Electronics', price: 1199, costPrice: 900, stockQuantity: 20, reorderThreshold: 5 },
    { name: 'Samsung S23 Ultra', sku: 'SAM-S23U', category: 'Electronics', price: 1199, costPrice: 850, stockQuantity: 5, reorderThreshold: 8 },
    { name: 'Nike Air Max', sku: 'NIKE-AM270', category: 'Clothing', price: 150, costPrice: 70, stockQuantity: 100, reorderThreshold: 20 },
    { name: 'Dyson V15', sku: 'DYSON-V15', category: 'Home', price: 749, costPrice: 500, stockQuantity: 12, reorderThreshold: 4 },
    { name: 'Sony WH-1000XM5', sku: 'SONY-XM5', category: 'Electronics', price: 399, costPrice: 280, stockQuantity: 0, reorderThreshold: 5 },
    { name: 'Levi 501 Original', sku: 'LEVI-501', category: 'Clothing', price: 89, costPrice: 40, stockQuantity: 60, reorderThreshold: 15 }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🌱 Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany();
        await Product.deleteMany();
        await Supplier.deleteMany();
        await Sale.deleteMany();

        // Create Admin & Staff (Mock with dummy googleId)
        const admin = await User.create({
            name: 'Demo Admin',
            email: 'admin@stock.com',
            googleId: 'google-dummy-12345',
            picture: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff',
            role: 'admin'
        });

        const staff = await User.create({
            name: 'Demo Staff',
            email: 'staff@stock.com',
            googleId: 'google-dummy-67890',
            picture: 'https://ui-avatars.com/api/?name=Staff&background=10B981&color=fff',
            role: 'staff'
        });

        console.log('✅ Demo Users created (Requires Google Login for new users)');

        // Create Suppliers
        const createdSuppliers = await Supplier.insertMany(suppliers);
        console.log(`✅ ${createdSuppliers.length} Suppliers created`);

        // Create Products (link to random supplier)
        const productsToInsert = products.map(p => ({
            ...p,
            supplier: createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)]._id
        }));
        const createdProducts = await Product.insertMany(productsToInsert);
        console.log(`✅ ${createdProducts.length} Products created`);

        // Create Mock Sales (for last 6 months)
        const salesToInsert = [];
        for (let i = 0; i < 100; i++) {
            const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
            const quantity = Math.floor(Math.random() * 3) + 1;
            const saleDate = new Date();
            saleDate.setMonth(saleDate.getMonth() - Math.floor(Math.random() * 6));
            saleDate.setDate(Math.floor(Math.random() * 28) + 1);

            salesToInsert.push({
                product: product._id,
                productName: product.name,
                quantity,
                unitPrice: product.price,
                totalAmount: product.price * quantity,
                customerName: ['Alice', 'Bob', 'Charlie', 'David', 'Eva'][Math.floor(Math.random() * 5)],
                saleDate,
                soldBy: staff._id
            });
        }
        await Sale.insertMany(salesToInsert);
        console.log('✅ 100 Mock sales generated for analytics');

        console.log('✨ Database seeding complete!');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
