#!/bin/bash

# Health Check Script for Production Deployment
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_URL=${1:-"https://your-frontend-domain.vercel.app"}
BACKEND_URL=${2:-"https://your-backend-domain.railway.app"}

echo "🏥 Running health checks..."
echo "Frontend URL: $FRONTEND_URL"
echo "Backend URL: $BACKEND_URL"
echo ""

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

# Check if curl is available
if ! command -v curl &> /dev/null; then
    print_error "curl is required for health checks"
    exit 1
fi

# Backend Health Checks
echo "🔧 Checking backend services..."

# Check backend health endpoint
if curl -f -s "$BACKEND_URL/health" > /dev/null; then
    print_status "Backend health endpoint responding"
else
    print_error "Backend health endpoint not responding"
fi

# Check backend API endpoints
if curl -f -s "$BACKEND_URL/api/auth/health" > /dev/null; then
    print_status "Authentication API responding"
else
    print_warning "Authentication API not responding (may be expected)"
fi

# Frontend Health Checks
echo ""
echo "🌐 Checking frontend..."

# Check if frontend loads
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    print_status "Frontend loading successfully"
else
    print_error "Frontend not loading"
fi

# Database Health Check
echo ""
echo "🗄️ Checking database connection..."
cd backend
if npm run ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('Database connection successful');
  process.exit(0);
}).catch((error) => {
  console.error('Database connection failed:', error);
  process.exit(1);
});
" 2>/dev/null; then
    print_status "Database connection successful"
else
    print_error "Database connection failed"
fi
cd ..

# External Services Check
echo ""
echo "📧 Checking external services..."

# This would require actual API calls with credentials
print_warning "External services check requires manual verification"
print_warning "- Test SendGrid email sending"
print_warning "- Test Twilio SMS sending (if configured)"

echo ""
echo "📊 Health check summary:"
echo "- Backend API: Check logs for detailed status"
echo "- Frontend: Verify user interface loads correctly"
echo "- Database: Verify connection and data integrity"
echo "- External Services: Test email/SMS functionality manually"

echo ""
echo "🔍 Additional checks to perform manually:"
echo "1. User registration and login"
echo "2. Company creation and management"
echo "3. Notes functionality"
echo "4. Notification system"
echo "5. Audit scheduling"
echo "6. Dashboard display"

echo ""
print_status "Health check script completed"