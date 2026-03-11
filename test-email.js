const nodemailer = require('nodemailer');

// Test with port 465 (SSL)
async function testPort465() {
  console.log('\n🧪 Testing Port 465 (SSL)...');
  const transporter = nodemailer.createTransport({
    host: 'mail.mbmodetlm.com',
    port: 465,
    secure: true,
    auth: {
      user: 'service@mbmodetlm.com',
      pass: '7zg75Au5h-bu29',
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log('✅ Port 465 connection successful!');
    return true;
  } catch (error) {
    console.log('❌ Port 465 failed:', error.message);
    return false;
  }
}

// Test with port 587 (TLS)
async function testPort587() {
  console.log('\n🧪 Testing Port 587 (TLS)...');
  const transporter = nodemailer.createTransport({
    host: 'mail.mbmodetlm.com',
    port: 587,
    secure: false,
    auth: {
      user: 'service@mbmodetlm.com',
      pass: '7zg75Au5h-bu29',
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log('✅ Port 587 connection successful!');
    return true;
  } catch (error) {
    console.log('❌ Port 587 failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('📧 Testing SMTP Connection...\n');
  
  const port465Works = await testPort465();
  const port587Works = await testPort587();
  
  console.log('\n📊 Results:');
  console.log(`Port 465 (SSL): ${port465Works ? '✅ Working' : '❌ Failed'}`);
  console.log(`Port 587 (TLS): ${port587Works ? '✅ Working' : '❌ Failed'}`);
  
  if (port465Works || port587Works) {
    console.log('\n✅ At least one port is working! Use the working configuration.');
  } else {
    console.log('\n❌ Both ports failed. Check:');
    console.log('  1. Email credentials are correct');
    console.log('  2. Email account exists and can send emails');
    console.log('  3. Firewall/antivirus is not blocking SMTP');
  }
}

runTests();
