import axios from 'axios';

async function testNotificationsAPI() {
  try {
    console.log('Testing the exact API call that\'s failing...');
    
    // First, let's try to get a valid token by logging in
    console.log('Step 1: Attempting to login to get a valid token...');
    
    // You'll need to replace these with actual credentials from your database
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@example.com', // Replace with actual email
      password: 'password123' // Replace with actual password
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.tokens.accessToken;
      console.log('✅ Login successful, got token');
      
      // Now test the notifications endpoint
      console.log('Step 2: Testing notifications/all endpoint...');
      const notificationsResponse = await axios.get(
        'http://localhost:3001/api/notifications/all?limit=20&offset=0',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Notifications API call successful!');
      console.log('Response:', notificationsResponse.data);
      
    } else {
      console.error('❌ Login failed:', loginResponse.data);
    }
    
  } catch (error: any) {
    console.error('❌ API test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testNotificationsAPI().then(() => process.exit(0));