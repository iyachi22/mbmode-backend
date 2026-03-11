const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

// Create transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    // Check if SMTP is configured
    if (emailConfig.smtp.auth.user && emailConfig.smtp.auth.pass) {
      transporter = nodemailer.createTransport(emailConfig.smtp);
    } else {
      // Fallback to console logging if SMTP not configured
      console.log('⚠️  SMTP not configured. Emails will be logged to console.');
      return null;
    }
  }
  return transporter;
}

async function sendOrderConfirmation(order, orderItems, pdfPath) {
  const transport = getTransporter();

  if (!transport) {
    console.log('📧 Order Confirmation Email (not sent - SMTP not configured):');
    console.log(`To: ${order.phone}`);
    console.log(`Order: ${order.order_number}`);
    console.log(`Customer: ${order.full_name}`);
    console.log(`Total: ${order.total_amount} DA`);
    console.log(`PDF: ${pdfPath}`);
    return { success: false, message: 'SMTP not configured' };
  }

  try {
    const mailOptions = {
      from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
      to: order.phone, // In production, use customer email
      subject: `Confirmation de commande #${order.order_number}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ffe44d; padding: 20px; text-center; }
            .header h1 { margin: 0; color: #0a0a0a; }
            .content { background: #f9f9f9; padding: 20px; }
            .order-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
            .order-info h2 { color: #0a0a0a; margin-top: 0; }
            .item { padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-size: 18px; font-weight: bold; color: #ffe44d; background: #0a0a0a; padding: 15px; text-align: right; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>mbmode</h1>
              <p>Mode Premium</p>
            </div>
            
            <div class="content">
              <h2>Merci pour votre commande!</h2>
              <p>Bonjour ${order.full_name},</p>
              <p>Nous avons bien reçu votre commande. Voici les détails:</p>
              
              <div class="order-info">
                <h2>Commande #${order.order_number}</h2>
                <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                <p><strong>Statut:</strong> En attente de confirmation</p>
              </div>
              
              <div class="order-info">
                <h3>Adresse de livraison</h3>
                <p>${order.full_name}<br>
                ${order.phone}<br>
                ${order.address}<br>
                ${order.commune}, ${order.wilaya_name}</p>
              </div>
              
              <div class="order-info">
                <h3>Articles commandés</h3>
                ${orderItems.map(item => `
                  <div class="item">
                    <strong>${item.product?.name_fr || 'Product'}</strong><br>
                    Quantité: ${item.quantity} × ${parseFloat(item.price).toFixed(2)} DA = ${(parseFloat(item.price) * item.quantity).toFixed(2)} DA
                  </div>
                `).join('')}
              </div>
              
              <div class="total">
                <div>Sous-total: ${parseFloat(order.subtotal).toFixed(2)} DA</div>
                <div>Livraison: ${parseFloat(order.shipping_price).toFixed(2)} DA</div>
                <div style="margin-top: 10px; font-size: 20px;">Total: ${parseFloat(order.total_amount).toFixed(2)} DA</div>
              </div>
              
              <p><strong>Mode de paiement:</strong> Paiement à la livraison</p>
              
              <p>Nous vous contacterons bientôt pour confirmer votre commande.</p>
            </div>
            
            <div class="footer">
              <p>Merci de votre confiance!<br>
              L'équipe mbmode</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: pdfPath ? [
        {
          filename: `commande-${order.order_number}.pdf`,
          path: pdfPath,
        },
      ] : [],
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
}

async function sendPasswordResetEmail(user, resetToken) {
  const transport = getTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
    to: user.email,
    subject: 'Reset Your Password - mbmode',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c2416; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .button { display: inline-block; background: #d4af37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #333; color: white; padding: 20px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name},</h2>
            
            <p>We received a request to reset your password for your mbmode account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>Best regards,<br>The mbmode Team</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 mbmode. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  if (!transport) {
    console.log('📧 Password Reset Email (not sent - SMTP not configured):');
    console.log(`To: ${user.email}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Reset URL: ${resetUrl}`);
    return;
  }

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('✅ Password reset email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    throw error;
  }
}

module.exports = { sendOrderConfirmation, sendPasswordResetEmail };
