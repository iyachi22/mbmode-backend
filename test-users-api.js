const axios = require('axios');

async function testUsersAPI() {
  try {
    console.log('🧪 Testing Users API...\n');

    // First, login to get a token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@mbmode.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful, got token');

    // Test users endpoint
    console.log('\n2. Fetching users...');
    const usersResponse = await axios.get('http://localhost:3000/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Users API working!');
    console.log(`📊 Found ${usersResponse.data.total} users`);
    console.log(`📄 Page ${usersResponse.data.page} of ${usersResponse.data.totalPages}`);
    
    if (usersResponse.data.users.length > 0) {
      console.log('\n👥 Sample users:');
      usersResponse.data.users.slice(0, 3).forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      });
    }

    // Test user detail endpoint
    if (usersResponse.data.users.length > 0) {
      const firstUser = usersResponse.data.users[0];
      console.log(`\n3. Testing user detail for ${firstUser.name}...`);
      
      const userDetailResponse = await axios.get(`http://localhost:3000/api/admin/users/${firstUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ User detail API working!');
      console.log(`📊 User has ${userDetailResponse.data.stats.total_orders} orders`);
    }

    console.log('\n🎉 All APIs working correctly!');
    
  } catch (error) {
    console.error('❌ API Test failed:', error.response?.data || error.message);
  }
}

testUsersAPI();