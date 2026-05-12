🏪 Smart Inventory Management System

A powerful web app to help businesses easily manage products, track stock, handle sales, and get smart reorder suggestions using predictive analytics.

✨ What It Does

✅ View real-time inventory and sales data on an interactive dashboard

✅ Add, edit, or delete products and track stock levels

✅ Get low stock alerts and smart reorder recommendations

✅ Record sales and analyze best-selling products

✅ Manage suppliers and purchase orders

✅ Generate simple reports (CSV export)

✅ Predict when you’ll run out of stock based on sales trends

🚀 How It Works

👩‍💻 Frontend:
Simple, responsive UI built with HTML, CSS, and JavaScript (Chart.js for graphs)

⚙️ Backend:
Node.js + Express APIs
MySQL for storing data
Background jobs for automated analysis

🐳 Docker Ready:
Easy to run with docker-compose for consistent environment

📦 Quick Start
Run Demo (No Database Needed)
git clone https://github.com/vedant21-ctr/StockAnalysis.git
cd StockAnalysis
npm install
cd client && npm install && npm start


Visit: http://localhost:3000 → Click "Enter System"

Full Setup with MySQL
npm install
cd client && npm install && cd ..

# Setup database
mysql -u root -p
CREATE DATABASE inventory_management;
# Load schema & seed data:
mysql -u root -p inventory_management < server/database/schema.sql
mysql -u root -p inventory_management < server/database/seed.sql

# Configure .env file with your DB details
cp .env.example .env

# Run server
npm run dev

💡 Why It’s Useful

Perfect for small businesses to:

Keep track of stock in real time

Get smart reorder suggestions automatically

See sales trends and make data-driven decisions

📈 Tech Stack

Frontend: HTML, CSS, JS, Chart.js

Backend: Node.js, Express, MySQL

Containerized with Docker

⭐ Demo Ready

No login, just click "Enter System"
Works on desktop, tablet, and mobile

📞 Need Help?

Create an issue on GitHub or email support@inventorymanager.com

Built with ❤️ by Vedant Satbhai
