#!/bin/bash

# Full Deployment Script for Client Management Platform
set -e

echo "🚀 Starting full deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js version
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ required, found version $NODE_VERSION"
    exit 1
fi
print_status "Node.js version check passed"

# Check if environment files exist
if [ ! -f "backend/.env.production" ]; then
    print_error "backend/.env.production not found"
    echo "Please copy and configure backend/.env.production from the template"
    exit 1
fi

if [ ! -f "frontend/.env.production" ]; then
    print_error "frontend/.env.production not found"
    echo "Please copy and configure frontend/.env.production from the template"
    exit 1
fi

print_status "Environment files found"

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm ci && cd ..
cd frontend && npm ci && cd ..
print_status "Dependencies installed"

# Run tests
echo "🧪 Running tests..."
cd backend && npm run test:all && cd ..
cd frontend && npm run test:coverage && cd ..
print_status "All tests passed"

# Build projects
echo "🔨 Building projects..."
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..
print_status "Projects built successfully"

# Test external services
echo "🔌 Testing external services..."
cd backend && npm run ts-node scripts/test-services.ts && cd ..
print_status "External services tested"

echo ""
echo "🎉 Pre-deployment checks complete!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy backend to Railway/Render:"
echo "   - Push code to your Git repository"
echo "   - Connect repository to Railway/Render"
echo "   - Configure environment variables"
echo "   - Deploy"
echo ""
echo "2. Deploy frontend to Vercel:"
echo "   - Run: ./scripts/deploy-frontend.sh production"
echo "   - Or connect Git repository to Vercel"
echo ""
echo "3. Set up production database:"
echo "   - Follow: backend/scripts/supabase-setup.md"
echo "   - Run: npm run ts-node scripts/setup-production-db.ts"
echo ""
echo "4. Configure external services:"
echo "   - Follow: backend/scripts/external-services-setup.md"
echo ""
echo "5. Verify deployment:"
echo "   - Test all functionality"
echo "   - Monitor logs and performance"
echo ""

print_warning "Remember to:"
print_warning "- Update CORS_ORIGIN with your actual frontend URL"
print_warning "- Configure proper secrets in production"
print_warning "- Set up monitoring and alerts"
print_warning "- Review security settings"

echo ""
echo "📚 For detailed instructions, see: DEPLOYMENT.md"