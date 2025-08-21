const axios = require('axios');

// Test the server connection
async function testServerConnection() {
  try {
    console.log('Testing connection to server at http://localhost:3000...');
    const response = await axios.get('http://localhost:3000');
    console.log('Server response:', response.status, response.statusText);
    console.log('Connection successful!');
  } catch (error) {
    console.log('Error connecting to server:');
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received from server. Make sure the server is running.');
    } else {
      // Something happened in setting up the request
      console.log('Error message:', error.message);
    }
  }
}

testServerConnection();
