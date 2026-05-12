const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB CONNECTION ERROR: ${error.message}`);
        console.log('---------------------------------------------------------');
        console.log('💡 TIP: Ensure MongoDB is installed and running locally.');
        console.log('💡 OR: Update MONGODB_URI in the root .env with an Atlas URI.');
        console.log('---------------------------------------------------------');
        process.exit(1);
    }
};

module.exports = connectDB;
