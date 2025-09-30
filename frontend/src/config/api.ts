// API Configuration
// This file handles API URL configuration for different environments

const getApiUrl = (): string => {
  // Check if we're in production and have a specific API URL
  if (process.env.NODE_ENV === 'production') {
    // Try to get from environment variable first
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }

    // Fallback to a production URL (update this with your Render URL)
    // Replace this with your actual Render backend URL
    return 'https://stunning-octo-meme-goc0.onrender.com';
  }

  // Development fallback
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiUrl();

// Export for debugging
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  environment: process.env.NODE_ENV,
  hasEnvVar: !!process.env.REACT_APP_API_URL,
};

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', API_CONFIG);
}
