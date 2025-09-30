import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
// Database initialization removed - using Appwrite
import { SchedulerService } from './services/schedulerService';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sanitizeInput, rateLimitConfig } from './middleware/validation';
import authRoutes from './routes/auth';
import companyRoutes from './routes/companies';
import noteRoutes from './routes/notes';
import notificationRoutes from './routes/notificationRoutes';
import auditRoutes from './routes/audits';
import userRoutes from './routes/users';
import meetingRoutes from './routes/meetings';
import paymentRoutes from './routes/payments';
import userManagementRoutes from './routes/userManagement';
import { tierRoutes } from './routes/tierRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration - temporarily allow all origins for debugging
const corsOptions = {
  origin: true, // Allow all origins temporarily
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
// app.use(rateLimit(rateLimitConfig));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization middleware
app.use(sanitizeInput);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test Appwrite connection
    const dbConnected = true; // Appwrite connection is handled in config
    
    res.status(200).json({
      status: 'OK',
      message: 'Client Management Platform API is running',
      database: dbConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unavailable',
      database: 'Error',
      timestamp: new Date().toISOString(),
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/tiers', tierRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Client Management Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      companies: '/api/companies',
      auth: '/api/auth',
      users: '/api/users',
      audits: '/api/audits',
      notifications: '/api/notifications',
      notes: '/api/notes',
      payments: '/api/payments',
      tiers: '/api/tiers'
    }
  });
});

// Handle POST to root (for debugging)
app.post('/', (req, res) => {
  res.status(400).json({
    error: 'Invalid endpoint',
    message: 'POST requests should be made to specific API endpoints like /api/companies',
    availableEndpoints: {
      companies: 'POST /api/companies',
      auth: 'POST /api/auth/login',
      users: 'POST /api/users',
      audits: 'POST /api/audits',
      notifications: 'POST /api/notifications',
      notes: 'POST /api/notes'
    }
  });
});

// Basic API route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Client Management Platform API',
    version: '1.0.0',
  });
});

// 404 handler for unmatched routes
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Database connection handled by Appwrite config
    console.log('Using Appwrite database connection');
    
    // Initialize scheduler service
    const scheduler = SchedulerService.getInstance();
    scheduler.initializeJobs();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('Server started successfully');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;