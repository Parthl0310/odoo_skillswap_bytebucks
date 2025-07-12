// Test script to register and login a user
const API_BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);

    // Register a test user
    console.log('\nRegistering test user...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        location: 'Test City',
        availability: 'flexible',
        skillsOffered: ['JavaScript'],
        skillsWanted: ['Python'],
        isPublic: true
      })
    });

    const registerData = await registerResponse.json();
    console.log('Register response:', registerData);

    if (registerData.success) {
      // Test login
      console.log('\nTesting login...');
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
    }

  } catch (error) {
    console.error('API test failed:', error);
  }
}

testAPI(); 