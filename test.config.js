// Comprehensive Test Configuration
// This file defines test settings and thresholds for the entire project

module.exports = {
  // Coverage thresholds
  coverage: {
    backend: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      // Critical files require higher coverage
      critical: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    frontend: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
      critical: {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
  },

  // Performance thresholds (in milliseconds)
  performance: {
    backend: {
      apiResponse: 1000,        // API responses should be under 1s
      databaseQuery: 500,       // Database queries should be under 500ms
      bulkOperations: 5000,     // Bulk operations should be under 5s
      concurrentRequests: 3000, // Concurrent requests should complete under 3s
    },
    frontend: {
      componentRender: 100,     // Component renders should be under 100ms
      pageLoad: 3000,          // Page loads should be under 3s
      userInteraction: 200,    // User interactions should respond under 200ms
    },
    e2e: {
      pageNavigation: 5000,    // Page navigation should complete under 5s
      formSubmission: 3000,    // Form submissions should complete under 3s
      dataLoading: 2000,       // Data loading should complete under 2s
    },
  },

  // Test environment configuration
  environment: {
    test: {
      database: {
        url: 'postgresql://test:test@localhost:5432/client_management_test',
        resetBetweenTests: true,
      },
      api: {
        baseUrl: 'http://localhost:5000/api',
        timeout: 10000,
      },
      frontend: {
        baseUrl: 'http://localhost:3000',
        timeout: 30000,
      },
    },
    ci: {
      database: {
        url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/client_management_test',
        resetBetweenTests: true,
      },
      api: {
        baseUrl: process.env.API_URL || 'http://localhost:5000/api',
        timeout: 15000,
      },
      frontend: {
        baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        timeout: 45000,
      },
    },
  },

  // Test categories and their requirements
  testCategories: {
    unit: {
      required: true,
      timeout: 5000,
      retries: 0,
    },
    integration: {
      required: true,
      timeout: 10000,
      retries: 1,
    },
    e2e: {
      required: false, // Optional in CI unless explicitly requested
      timeout: 30000,
      retries: 2,
    },
    performance: {
      required: true,
      timeout: 60000,
      retries: 0,
    },
  },

  // Critical test paths that must always pass
  criticalPaths: [
    'authentication',
    'company-management',
    'notes-system',
    'audit-scheduling',
    'notification-system',
  ],

  // Test reporting configuration
  reporting: {
    formats: ['json', 'lcov', 'text', 'html'],
    outputDir: 'reports',
    includeUncoveredFiles: true,
    generateSummary: true,
  },

  // Parallel execution settings
  parallel: {
    backend: {
      maxWorkers: 4,
      testTimeout: 10000,
    },
    frontend: {
      maxWorkers: 2,
      testTimeout: 15000,
    },
  },

  // Test data management
  testData: {
    cleanup: {
      afterEach: true,
      afterAll: true,
    },
    fixtures: {
      users: 'test/fixtures/users.json',
      companies: 'test/fixtures/companies.json',
    },
  },

  // Notification settings for test results
  notifications: {
    onFailure: true,
    onSuccess: false,
    channels: ['console', 'file'],
  },
};