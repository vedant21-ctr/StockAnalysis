# Advanced Inventory Management System - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation Steps

1. **Clone and Install Dependencies**
   ```bash
   # Install server dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

2. **Database Setup**
   ```bash
   # Create MySQL database
   mysql -u root -p
   ```
   
   ```sql
   CREATE DATABASE inventory_management;
   exit;
   ```
   
   ```bash
   # Run schema and seed data
   mysql -u root -p inventory_management < server/database/schema.sql
   mysql -u root -p inventory_management < server/database/seed.sql
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Edit .env file with your database credentials
   nano .env
   ```

4. **Start the Application**
   ```bash
   # Development mode (runs both server and client)
   npm run dev
   
   # Or run separately:
   # Server only: npm run server
   # Client only: npm run client
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Demo Login: admin / password

## 🔧 Configuration

### Database Configuration
Update `.env` file with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=inventory_management
DB_PORT=3306
```

### JWT Configuration
Change the JWT secret for production:
```env
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

## 📊 Features

### ✅ Implemented
- **Authentication System** - JWT-based login/logout
- **Dashboard** - Real-time inventory overview with charts
- **Product Management** - Full CRUD operations
- **Stock Tracking** - Real-time stock levels and movements
- **Sales Recording** - Transaction logging with analytics
- **Predictive Analytics** - AI-powered reorder suggestions
- **Low Stock Alerts** - Automated notifications
- **Responsive UI** - Modern, mobile-friendly interface

### 🔄 Background Jobs
- **Stock Analysis** - Runs daily at 2 AM
- **Reorder Predictions** - Based on sales velocity
- **Notification Cleanup** - Weekly maintenance

### 📱 API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

#### Products
- `GET /api/products` - List products (with pagination/filtering)
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Stock Management
- `GET /api/stock/low` - Get low stock products
- `PUT /api/stock/:id` - Update stock levels
- `GET /api/stock/movements/:productId` - Stock movement history
- `GET /api/stock/reorder-suggestions` - AI reorder suggestions

#### Sales
- `POST /api/sales` - Record new sale
- `GET /api/sales` - Sales history
- `GET /api/sales/summary` - Sales analytics
- `GET /api/sales/product/:id/analytics` - Product sales data

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard overview
- `GET /api/analytics/trends` - Sales trends
- `GET /api/analytics/inventory` - Inventory analytics
- `GET /api/analytics/predictions` - Predictive analytics
- `GET /api/analytics/profit` - Profit analysis

#### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

## 🎯 Demo Data

The system comes with pre-loaded demo data:

### Demo Users
- **admin** / password (Admin role)
- **manager** / password (Manager role)  
- **staff** / password (Staff role)

### Sample Products
- Electronics (iPhones, MacBooks, Headphones)
- Clothing (Shoes, Jeans, Hoodies)
- Books (Business, Self-help, Technical)
- Home & Garden (Appliances, Tools)

### Sample Sales Data
- 30 days of transaction history
- Various customer purchases
- Stock movement tracking

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization

## 📈 Predictive Analytics

The system includes advanced predictive features:

### Stock Predictions
- Sales velocity analysis
- Trend detection (increasing/decreasing/stable)
- Days of stock remaining calculation
- Automated reorder suggestions

### Alert System
- Low stock notifications
- Out of stock alerts
- Reorder recommendations
- Critical stock warnings

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV=production
DB_HOST=your_production_db_host
JWT_SECRET=your_production_jwt_secret
```

### Build for Production
```bash
# Build client
cd client
npm run build
cd ..

# Start production server
NODE_ENV=production npm start
```

### Recommended Deployment Platforms
- **Heroku** - Easy deployment with MySQL add-on
- **DigitalOcean** - App Platform or Droplets
- **AWS** - EC2 with RDS MySQL
- **Railway** - Simple deployment with database

## 🛠️ Development

### Project Structure
```
├── server/                 # Backend Node.js/Express
│   ├── config/            # Database configuration
│   ├── database/          # SQL schema and seeds
│   ├── jobs/              # Background jobs
│   ├── middleware/        # Authentication middleware
│   ├── routes/            # API routes
│   └── index.js           # Server entry point
├── client/                # Frontend
│   ├── src/
│   │   ├── js/           # JavaScript modules
│   │   ├── styles.css    # CSS styles
│   │   ├── index.html    # Main HTML
│   │   └── index.js      # Entry point
│   ├── webpack.config.js # Build configuration
│   └── package.json      # Client dependencies
├── package.json          # Server dependencies
└── README.md            # Documentation
```

### Adding New Features

1. **Backend**: Add routes in `server/routes/`
2. **Frontend**: Add modules in `client/src/js/`
3. **Database**: Update schema in `server/database/schema.sql`
4. **Jobs**: Add background tasks in `server/jobs/`

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify database connection
3. Ensure all dependencies are installed
4. Check environment variables

## 🎉 Success!

Your Advanced Inventory Management System is now ready! 

Access the application at http://localhost:3000 and login with:
- Username: **admin**
- Password: **password**

Enjoy managing your inventory with predictive analytics! 📊