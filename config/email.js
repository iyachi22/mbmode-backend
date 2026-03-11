module.exports = {
  smtp: {
    host: process.env.MAIL_HOST || 'mail.mbmodetlm.com',
    port: parseInt(process.env.MAIL_PORT) || 465,
    secure: process.env.MAIL_SECURE === 'true' || process.env.MAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // Accept self-signed certificates
    }
  },
  from: {
    name: process.env.MAIL_FROM_NAME || 'mbmode',
    address: process.env.MAIL_FROM_ADDRESS || 'service@mbmodetlm.com',
  },
}
