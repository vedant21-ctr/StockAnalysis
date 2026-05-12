const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Please add a product'],
    },
    productName: String, // Mirroring name for historical accuracy
    quantity: {
        type: Number,
        required: [true, 'Please add a quantity'],
    },
    unitPrice: {
        type: Number,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    customerName: {
        type: String,
        default: 'Walk-in Customer',
    },
    saleDate: {
        type: Date,
        default: Date.now,
    },
    soldBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    }
}, {
    timestamps: true,
});

// Calculate totalAmount before saving
saleSchema.pre('save', function (next) {
    this.totalAmount = this.quantity * this.unitPrice;
    next();
});

module.exports = mongoose.model('Sale', saleSchema);
