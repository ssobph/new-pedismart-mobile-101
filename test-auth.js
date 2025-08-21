const axios = require('axios');

// Test the auth endpoint
async function testAuthEndpoint() {
  const baseUrl = 'http://10.0.254.226:3000'; // Using your IP address
  
  console.log('Testing connection to auth endpoint...');
  
  try {
    // First try to access the auth route (should return 404 since we're using GET)
    console.log(`Testing GET ${baseUrl}/auth...`);
    try {
      await axios.get(`${baseUrl}/auth`);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Auth route exists (404 is expected for GET request)');
      } else {
        console.log('❌ Error accessing auth route:', error.message);
      }
    }
    
    // Now try the signin endpoint with a test payload
    console.log(`Testing POST ${baseUrl}/auth/signin...`);
    try {
      const response = await axios.post(`${baseUrl}/auth/signin`, {
        role: 'customer',
        phone: '1234567890'
      });
      console.log('✅ Signin endpoint response:', response.status, response.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ Signin error response:', error.response.status, error.response.data);
      } else {
        console.log('❌ Signin error:', error.message);
      }
    }
  } catch (error) {
    console.log('❌ General error:', error.message);
  }
}

testAuthEndpoint();
