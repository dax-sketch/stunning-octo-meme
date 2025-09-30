import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

async function testServerHealth() {
  console.log('🔍 Testing server health...');
  
  try {
    // Test if server is running
    console.log('\n1. Testing server connectivity...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000
    });
    
    console.log('✅ Server is running:', healthResponse.data);
    
    // Test if meetings endpoint exists (should return 401 without auth)
    console.log('\n2. Testing meetings endpoint (should return 401)...');
    try {
      await axios.get(`${API_BASE_URL}/api/meetings/upcoming`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        console.log('✅ Meetings endpoint exists and requires auth (expected)');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Server health check failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 The backend server is not running.');
      console.log('   Please start it with: npm run dev');
    }
  }
}

testServerHealth();