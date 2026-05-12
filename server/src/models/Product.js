const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a product name'],
        trim: true,
    },
    sku: {
        type: String,
        required: [true, 'Please add SKU'],
        unique: true,
        uppercase: true,
    },
    description: String,
    category: {
        type: String, // String for simplicity, or we could link to a Category model. 
        required: [true, 'Please add a category'],
    },
    price: {
        type: Number,
        required: [true, 'Please add a selling price'],
    },
    costPrice: {
        type: Number,
        required: [true, 'Please add a cost price'],
    },
    stockQuantity: {
        type: Number,
        required: [true, 'Please add stock quantity'],
        default: 0,
    },
    reorderThreshold: {
        type: Number,
        default: 10,
    },
    supplier: {
        type: mongoose.Schema.ObjectId,
        ref: 'Supplier',
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual for Stock Status
productSchema.virtual('stockStatus').get(function () {
    if (this.stockQuantity === 0) return 'Out of Stock';
    if (this.stockQuantity <= this.reorderThreshold) return 'Low Stock';
    return 'In Stock';
});

module.exports = mongoose.model('Product', productSchema);
