#!/bin/bash

# Advanced Inventory Management System - Deployment Script
echo "🚀 Preparing for deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🏗️ Building frontend..."
cd client
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo "✅ Build completed successfully!"
echo ""
echo "📋 Deployment ready:"
echo "- Frontend built in client/dist/"
echo "- Backend configured for API-only mode"
echo "- Mock data enabled for demo"
echo ""
echo "🌐 Deploy to Render:"
echo "1. Connect your GitHub repo to Render"
echo "2. Use these settings:"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo "   - Environment: Node.js"
echo ""
echo "🎉 Your app will be live at: https://your-app-name.onrender.com"