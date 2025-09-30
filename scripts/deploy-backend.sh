#!/bin/bash

# Backend Deployment Script for Railway/Render
set -e

echo "🚀 Deploying Backend..."

# Navigate to backend directory
cd backend

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests
echo "🧪 Running tests..."
npm run test:all

# Build the project
echo "🔨 Building project..."
npm run build

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npm run db:generate

echo "✅ Backend build complete!"
echo "📋 Next steps:"
echo "  1. Push to your Git repository"
echo "  2. Connect repository to Railway or Render"
echo "  3. Set environment variables in the platform"
echo "  4. Deploy!"