#!/bin/bash

# Frontend Deployment Script for Vercel
set -e

echo "🚀 Deploying Frontend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm run test:coverage

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
if [ "$1" = "production" ]; then
    vercel --prod
else
    vercel
fi

echo "✅ Frontend deployment complete!"