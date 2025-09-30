import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001';

async function testMeetingEndpoints() {
  console.log('🔍 Testing meeting API endpoints...');
  
  try {
    // Test the upcoming meetings endpoint
    console.log('\n1. Testing GET /api/meetings/upcoming...');
    const upcomingResponse = await axios.get(`${API_BASE_URL}/api/meetings/upcoming?days=7`, {
      headers: {
        'Authorization': 'Bearer test-token' // You'll need a valid token
      }
    });
    
    console.log('✅ Upcoming meetings response:', upcomingResponse.data);
    
    // Test the all meetings endpoint
    console.log('\n2. Testing GET /api/meetings...');
    const allMeetingsResponse = await axios.get(`${API_BASE_URL}/api/meetings`, {
      headers: {
        'Authorization': 'Bearer test-token' // You'll need a valid token
      }
    });
    
    console.log('✅ All meetings response:', allMeetingsResponse.data);
    
  } catch (error: any) {
    console.error('❌ API test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 This is likely an authentication issue. The API requires a valid JWT token.');
      console.log('   Try logging into the frontend first to get a valid token.');
    }
  }
}

testMeetingEndpoints();