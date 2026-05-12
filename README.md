# 🏪 SmartStock | Premium Inventory & Business Intelligence

A high-performance, modern full-stack web application designed for small-to-medium businesses to manage inventory, track sales, and generate predictive analytics.

---

### 🚀 Key Features

- **Executive Dashboard**: Real-time KPIs (Revenue, Profit, Margin, Inventory Value).
- **Inventory Management**: Full CRUD for products with SKU tracking, reorder thresholds, and category classification.
- **Sales Engine**: Record transactions with automatic stock decrementing and customer tracking.
- **Business Intelligence**: 
  - **ABC Analysis**: Automatically categorize products by revenue (80/15/5 rule).
  - **Sales Forecasting**: Predictive revenue trends based on historical data.
  - **Supplier Scorecards**: Monitor vendor performance, lead times, and quality ratings.
- **Security**: JWT-based authentication with role-based access control (Admin/Staff).

### 🛠 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Recharts, Framer Motion.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose).
- **Auth**: JWT, bcryptjs.

---

### 📦 Quick Setup

#### 1. Setup Environment
Add a `.env` file in the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stock_analysis
JWT_SECRET=your_super_secret_key
NODE_ENV=development
```

#### 2. Install Dependencies
```bash
npm run install-all
```

#### 3. Seed the Database (Demo Ready)
To populate with initial products, users, and 6 months of sales data:
```bash
npm run seed
```

#### 4. Run Application
```bash
npm run dev
```
Visit: `http://localhost:3000`

---

### 👤 Demo Credentials
- **Admin**: `admin@stock.com` / `password123`
- **Staff**: `staff@stock.com` / `password123`

---

Built with ❤️ by Antigravity (Senior Full-Stack Engineer)
