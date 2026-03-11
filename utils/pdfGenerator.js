const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

async function generateOrderPDF(order, orderItems) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const fileName = `order-${order.order_number}.pdf`;
      const filePath = path.join(__dirname, '../temp', fileName);

      // Ensure temp directory exists
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add logo if exists
      const logoPath = path.join(__dirname, '../uploads/logo.jpg');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 80 });
      }

      // Company info
      doc
        .fontSize(20)
        .text('mbmode', 200, 50, { align: 'right' })
        .fontSize(10)
        .text('Mode Premium', 200, 75, { align: 'right' })
        .moveDown();

      // Title
      doc
        .fontSize(20)
        .text('REÇU DE COMMANDE', 50, 150, { align: 'center' })
        .moveDown();

      // Order info
      doc
        .fontSize(12)
        .text(`Numéro de commande: ${order.order_number}`, 50, 200)
        .text(`Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}`, 50, 220)
        .text(`Statut: ${order.status}`, 50, 240)
        .moveDown();

      // Customer info
      doc
        .fontSize(14)
        .text('Informations client', 50, 280)
        .fontSize(10)
        .text(`Nom: ${order.full_name}`, 50, 305)
        .text(`Téléphone: ${order.phone}`, 50, 320)
        .text(`Wilaya: ${order.wilaya_name}`, 50, 335)
        .text(`Commune: ${order.commune}`, 50, 350)
        .text(`Adresse: ${order.address}`, 50, 365, { width: 500 })
        .moveDown();

      // Items table header
      const tableTop = 420;
      doc
        .fontSize(12)
        .text('Produit', 50, tableTop)
        .text('Qté', 300, tableTop)
        .text('Prix', 370, tableTop)
        .text('Total', 470, tableTop);

      // Draw line
      doc
        .moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

      // Items
      let yPosition = tableTop + 25;
      orderItems.forEach((item) => {
        const itemTotal = parseFloat(item.price) * item.quantity;
        doc
          .fontSize(10)
          .text(item.product?.name_fr || 'Product', 50, yPosition, { width: 240 })
          .text(item.quantity.toString(), 300, yPosition)
          .text(`${parseFloat(item.price).toFixed(2)} DA`, 370, yPosition)
          .text(`${itemTotal.toFixed(2)} DA`, 470, yPosition);

        yPosition += 25;
      });

      // Draw line before totals
      yPosition += 10;
      doc
        .moveTo(50, yPosition)
        .lineTo(550, yPosition)
        .stroke();

      // Totals
      yPosition += 20;
      doc
        .fontSize(10)
        .text('Sous-total:', 370, yPosition)
        .text(`${parseFloat(order.subtotal).toFixed(2)} DA`, 470, yPosition);

      yPosition += 20;
      doc
        .text('Livraison:', 370, yPosition)
        .text(`${parseFloat(order.shipping_price).toFixed(2)} DA`, 470, yPosition);

      yPosition += 20;
      doc
        .fontSize(12)
        .text('Total:', 370, yPosition)
        .text(`${parseFloat(order.total_amount).toFixed(2)} DA`, 470, yPosition);

      // Payment method
      yPosition += 40;
      doc
        .fontSize(10)
        .text('Mode de paiement: Paiement à la livraison', 50, yPosition);

      // Footer
      doc
        .fontSize(8)
        .text(
          'Merci pour votre commande!',
          50,
          doc.page.height - 100,
          { align: 'center', width: 500 }
        )
        .text(
          'Pour toute question, contactez-nous',
          50,
          doc.page.height - 85,
          { align: 'center', width: 500 }
        );

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateOrderPDF };
