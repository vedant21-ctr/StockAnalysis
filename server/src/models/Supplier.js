const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a supplier name'],
        trim: true,
    },
    contactPerson: String,
    email: {
        type: String,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
    },
    phone: String,
    address: String,
    isActive: {
        type: Boolean,
        default: true
    },
    qualityRating: {
        type: Number,
        min: 1,
        max: 5,
        default: 4.5
    },
    avgLeadTime: {
        type: Number, // days
        default: 5
    },
    onTimeDelivery: {
        type: Number, // percentage
        default: 95
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
