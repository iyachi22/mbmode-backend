const nodemailer = require('nodemailer');
const net = require('net');

// Test 1: Check if we can reach the mail server
async function testConnection() {
  console.log('\n🔍 Test 1: Checking if mail server is reachable...');
  
  return new Promise((resolve) => {
    const socket = net.createConnection(465, 'mail.mbmodetlm.com');
    
    socket.on('connect', () => {
      console.log('✅ Can connect to mail.mbmodetlm.com:465');
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (err) => {
      console.log('❌ Cannot connect to mail server:', err.message);
      resolve(false);
    });
    
    socket.setTimeout(5000, () => {
      console.log('❌ Connection timeout');
      socket.destroy();
      resolve(false);
    });
  });
}

// Test 2: Try with different authentication methods
async function testWithPlainAuth() {
  console.log('\n🔍 Test 2: Testing with PLAIN authentication...');
  
  const transporter = nodemailer.createTransport({
    host: 'mail.mbmodetlm.com',
    port: 465,
    secure: true,
    auth: {
      user: 'service@mbmodetlm.com',
      pass: '7zg75Au5h-bu29',
    },
    authMethod: 'PLAIN',
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1'
    },
    debug: true,
    logger: true
  });

  try {
    await transporter.verify();
    console.log('✅ PLAIN auth successful!');
    return true;
  } catch (error) {
    console.log('❌ PLAIN auth failed:', error.message);
    return false;
  }
}

// Test 3: Try with LOGIN authentication
async function testWithLoginAuth() {
  console.log('\n🔍 Test 3: Testing with LOGIN authentication...');
  
  const transporter = nodemailer.createTransport({
    host: 'mail.mbmodetlm.com',
    port: 465,
    secure: true,
    auth: {
      user: 'service@mbmodetlm.com',
      pass: '7zg75Au5h-bu29',
    },
    authMethod: 'LOGIN',
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1'
    }
  });

  try {
    await transporter.verify();
    console.log('✅ LOGIN auth successful!');
    return true;
  } catch (error) {
    console.log('❌ LOGIN auth failed:', error.message);
    return false;
  }
}

// Test 4: Try port 587 with STARTTLS
async function testPort587() {
  console.log('\n🔍 Test 4: Testing port 587 with STARTTLS...');
  
  const transporter = nodemailer.createTransport({
    host: 'mail.mbmodetlm.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: 'service@mbmodetlm.com',
      pass: '7zg75Au5h-bu29',
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1'
    }
  });

  try {
    await transporter.verify();
    console.log('✅ Port 587 successful!');
    return true;
  } catch (error) {
    console.log('❌ Port 587 failed:', error.message);
    return false;
  }
}

// Test 5: Check DNS resolution
async function testDNS() {
  console.log('\n🔍 Test 5: Checking DNS resolution...');
  const dns = require('dns').promises;
  
  try {
    const addresses = await dns.resolve4('mail.mbmodetlm.com');
    console.log('✅ DNS resolved to:', addresses.join(', '));
    return true;
  } catch (error) {
    console.log('❌ DNS resolution failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('📧 Running Comprehensive Email Tests...\n');
  console.log('Testing with:');
  console.log('  Host: mail.mbmodetlm.com');
  console.log('  User: service@mbmodetlm.com');
  console.log('  Pass: 7zg75Au5h-bu29');
  
  const results = {
    connection: await testConnection(),
    dns: await testDNS(),
    plainAuth: await testWithPlainAuth(),
    loginAuth: await testWithLoginAuth(),
    port587: await testPort587()
  };
  
  console.log('\n📊 Summary:');
  console.log('─────────────────────────────────────');
  console.log(`Server Reachable:    ${results.connection ? '✅' : '❌'}`);
  console.log(`DNS Resolution:      ${results.dns ? '✅' : '❌'}`);
  console.log(`PLAIN Auth (465):    ${results.plainAuth ? '✅' : '❌'}`);
  console.log(`LOGIN Auth (465):    ${results.loginAuth ? '✅' : '❌'}`);
  console.log(`Port 587 (STARTTLS): ${results.port587 ? '✅' : '❌'}`);
  console.log('─────────────────────────────────────');
  
  if (!results.connection) {
    console.log('\n⚠️  Cannot reach mail server. Possible causes:');
    console.log('  • Firewall blocking outgoing connections');
    console.log('  • Antivirus blocking SMTP');
    console.log('  • Mail server is down');
    console.log('  • Wrong mail server address');
  } else if (!results.plainAuth && !results.loginAuth && !results.port587) {
    console.log('\n⚠️  Can reach server but authentication fails. Possible causes:');
    console.log('  • Wrong password');
    console.log('  • Email account doesn\'t exist');
    console.log('  • SMTP authentication disabled in cPanel');
    console.log('  • Account locked or suspended');
    console.log('\n💡 Try:');
    console.log('  1. Log into webmail with these credentials');
    console.log('  2. Check cPanel → Email Accounts → service@mbmodetlm.com');
    console.log('  3. Verify "Allow SMTP" is enabled');
    console.log('  4. Try resetting the password');
  } else {
    console.log('\n✅ Email is working! Use the successful configuration.');
  }
}

runAllTests();
