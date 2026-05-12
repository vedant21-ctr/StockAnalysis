const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
    },
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    picture: String,
    role: {
        type: String,
        default: 'admin',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
