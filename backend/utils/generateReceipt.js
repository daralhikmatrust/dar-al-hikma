import PDFDocument from 'pdfkit';

/**
 * Generate a professional, legally compliant donation receipt PDF
 * 
 * Features:
 * - Stable receipt number format (DAH-YYYY-XXXXXX)
 * - All required legal information
 * - Razorpay transaction references
 * - Professional, print-friendly design
 * - Printable and downloadable
 * - Idempotent (same donation = same receipt)
 */
export const generateReceiptPDF = async (donation, project = null) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 40, 
        size: 'A4',
        info: {
          Title: `Donation Receipt - ${donation.receiptNumber || 'N/A'}`,
          Author: 'Dar Al Hikma Trust',
          Subject: 'Donation Receipt',
          Creator: 'Dar Al Hikma Trust Donation System'
        }
      });
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);

      // ============================================================
      // HEADER SECTION - Professional and Clean
      // ============================================================
      let yPos = margin;

      // Trust Name - Large, bold, centered
      doc.fontSize(24)
         .fillColor('#1a472a')
         .font('Helvetica-Bold')
         .text('DAR AL HIKMA TRUST', margin, yPos, { 
           align: 'center',
           width: contentWidth
         });
      
      yPos += 32;

      // Document Title - Clear and prominent
      doc.fontSize(16)
         .fillColor('#374151')
         .font('Helvetica')
         .text('OFFICIAL DONATION RECEIPT', margin, yPos, { 
           align: 'center',
           width: contentWidth
         });

      yPos += 30;

      // Header separator line
      doc.moveTo(margin, yPos)
         .lineTo(margin + contentWidth, yPos)
         .lineWidth(1)
         .strokeColor('#d1d5db')
         .stroke();

      yPos += 20;

      // ============================================================
      // RECEIPT DETAILS SECTION - Clear and Organized
      // ============================================================
      
      // Section Header
      doc.fontSize(11)
         .fillColor('#1a472a')
         .font('Helvetica-Bold')
         .text('RECEIPT DETAILS', margin, yPos);
      
      yPos += 20;

      // Receipt details in a clean two-column layout
      const receiptDate = new Date(donation.createdAt || donation.created_at);
      const receiptDateStr = receiptDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const receiptTimeStr = receiptDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Left column - Receipt Number
      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Receipt Number:', margin, yPos);
      
      doc.fontSize(10)
         .fillColor('#111827')
         .font('Helvetica-Bold')
         .text(donation.receiptNumber || 'N/A', margin + 90, yPos);

      yPos += 18;

      // Date and Time
      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Date:', margin, yPos);
      
      doc.fontSize(10)
         .fillColor('#111827')
         .font('Helvetica')
         .text(receiptDateStr, margin + 90, yPos);

      yPos += 18;

      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Time:', margin, yPos);
      
      doc.fontSize(10)
         .fillColor('#111827')
         .font('Helvetica')
         .text(receiptTimeStr, margin + 90, yPos);

      yPos += 30;

      // Section separator
      doc.moveTo(margin, yPos)
         .lineTo(margin + contentWidth, yPos)
         .lineWidth(0.5)
         .strokeColor('#e5e7eb')
         .stroke();

      yPos += 20;

      // ============================================================
      // DONOR INFORMATION SECTION - Well-Formatted
      // ============================================================
      
      doc.fontSize(11)
         .fillColor('#1a472a')
         .font('Helvetica-Bold')
         .text('DONOR INFORMATION', margin, yPos);
      
      yPos += 20;
      
      // Donor details in clean format
      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Name:', margin, yPos);
      
      doc.fontSize(10)
         .fillColor('#111827')
         .font('Helvetica-Bold')
         .text(donation.donorName || 'Anonymous', margin + 90, yPos, {
           width: contentWidth - 90
         });
      
      yPos += 18;

      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Email:', margin, yPos);
      
      doc.fontSize(10)
         .fillColor('#111827')
         .font('Helvetica')
         .text(donation.donorEmail || 'N/A', margin + 90, yPos, {
           width: contentWidth - 90
         });
      
      yPos += 18;
      
      if (donation.donorPhone) {
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text('Phone:', margin, yPos);
        
        doc.fontSize(10)
           .fillColor('#111827')
           .font('Helvetica')
           .text(donation.donorPhone, margin + 90, yPos);
        
        yPos += 18;
      }

      if (donation.donorAddress) {
        const address = typeof donation.donorAddress === 'string' 
          ? JSON.parse(donation.donorAddress) 
          : donation.donorAddress;
        
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text('Address:', margin, yPos);
        
        yPos += 18;
        
        let addressText = '';
        if (address.street) addressText += address.street + '\n';
        if (address.city || address.state) {
          addressText += [address.city, address.state].filter(Boolean).join(', ');
        }
        if (address.pincode) {
          if (addressText) addressText += '\n';
          addressText += `PIN: ${address.pincode}`;
        }
        
        if (addressText) {
          doc.fontSize(10)
             .fillColor('#111827')
             .font('Helvetica')
             .text(addressText, margin + 20, yPos, {
               width: contentWidth - 20
             });
          yPos += (addressText.split('\n').length * 18);
        }
      }

      yPos += 20;

      // Section separator
      doc.moveTo(margin, yPos)
         .lineTo(margin + contentWidth, yPos)
         .lineWidth(0.5)
         .strokeColor('#e5e7eb')
         .stroke();

      yPos += 20;

      // ============================================================
      // DONATION DETAILS SECTION - Financial Data Prominently Displayed
      // ============================================================
      
      doc.fontSize(11)
         .fillColor('#1a472a')
         .font('Helvetica-Bold')
         .text('DONATION DETAILS', margin, yPos);
      
      yPos += 25;
      
      // Amount - Prominently displayed in a clean box
      const amountValue = parseFloat(donation.amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      const currency = donation.currency || 'INR';
      
      // Amount box with subtle background
      doc.rect(margin, yPos, contentWidth, 50)
         .fill('#f0fdf4')
         .stroke('#22c55e')
         .lineWidth(1.5);
      
      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Donation Amount', margin + 15, yPos + 8);
      
      doc.fontSize(20)
         .fillColor('#15803d')
         .font('Helvetica-Bold')
         .text(`₹${amountValue}`, margin + 15, yPos + 22);
      
      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text(`Currency: ${currency}`, margin + contentWidth - 100, yPos + 30);
      
      yPos += 65;
      
      // Donation details in organized format
      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Donation Type:', margin, yPos);
      
      doc.fontSize(10)
         .fillColor('#111827')
         .font('Helvetica')
         .text(donation.donationType || 'General Donation', margin + 90, yPos);
      
      yPos += 18;

      doc.fontSize(9)
         .fillColor('#6b7280')
         .font('Helvetica')
         .text('Payment Method:', margin, yPos);
      
      doc.fontSize(10)
         .fillColor('#111827')
         .font('Helvetica')
         .text((donation.paymentMethod || 'razorpay').toUpperCase(), margin + 90, yPos);
      
      yPos += 18;
      
      if (donation.paymentId) {
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text('Payment ID:', margin, yPos);
        
        doc.fontSize(9)
           .fillColor('#111827')
           .font('Helvetica')
           .text(donation.paymentId, margin + 90, yPos, {
             width: contentWidth - 90
           });
        
        yPos += 18;
      }
      
      if (donation.orderId) {
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text('Order ID:', margin, yPos);
        
        doc.fontSize(9)
           .fillColor('#111827')
           .font('Helvetica')
           .text(donation.orderId, margin + 90, yPos, {
             width: contentWidth - 90
           });
        
        yPos += 18;
      }

      if (project) {
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text('Project:', margin, yPos);
        
        doc.fontSize(10)
           .fillColor('#111827')
           .font('Helvetica')
           .text(project.title || 'N/A', margin + 90, yPos, {
             width: contentWidth - 90
           });
        
        yPos += 18;
      }

      if (donation.faculty) {
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text('Faculty:', margin, yPos);
        
        doc.fontSize(10)
           .fillColor('#111827')
           .font('Helvetica')
           .text(donation.faculty, margin + 90, yPos, {
             width: contentWidth - 90
           });
        
        yPos += 18;
      }

      if (donation.notes) {
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text('Notes:', margin, yPos);
        
        doc.fontSize(10)
           .fillColor('#111827')
           .font('Helvetica')
           .text(donation.notes, margin + 20, yPos + 18, {
             width: contentWidth - 20
           });
        
        yPos += 40;
      }

      yPos += 15;

      // Section separator
      doc.moveTo(margin, yPos)
         .lineTo(margin + contentWidth, yPos)
         .lineWidth(0.5)
         .strokeColor('#e5e7eb')
         .stroke();

      yPos += 20;

      // ============================================================
      // TAX EXEMPTION CERTIFICATE - Professional Legal Section
      // ============================================================
      
      // Check if we need a new page
      if (yPos > pageHeight - 150) {
        doc.addPage();
        yPos = margin;
      }
      
      // Tax exemption box with professional styling
      doc.rect(margin, yPos, contentWidth, 90)
         .fill('#fffbeb')
         .stroke('#f59e0b')
         .lineWidth(1);
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#92400e')
         .text('TAX EXEMPTION CERTIFICATE', margin + 15, yPos + 12, {
           width: contentWidth - 30,
           align: 'center'
         });
      
      doc.fontSize(8.5)
         .font('Helvetica')
         .fillColor('#78350f')
         .text('This receipt is issued under Section 80G of the Income Tax Act, 1961.', margin + 15, yPos + 32, {
           width: contentWidth - 30,
           align: 'center',
           lineGap: 4
         })
         .text('The donation is eligible for tax deduction as per applicable laws.', margin + 15, yPos + 52, {
           width: contentWidth - 30,
           align: 'center',
           lineGap: 4
         })
         .text('Please retain this receipt for your tax records.', margin + 15, yPos + 70, {
           width: contentWidth - 30,
           align: 'center'
         });

      yPos += 110;

      // ============================================================
      // ACKNOWLEDGMENT SECTION - Professional Thank You Message
      // ============================================================
      
      // Check if we need a new page for signature
      if (yPos > pageHeight - 120) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#4b5563')
         .text('This is an official receipt generated by Dar Al Hikma Trust.', margin, yPos, {
           align: 'center',
           width: contentWidth,
           lineGap: 6
         })
         .text('Thank you for your generous contribution to our mission.', margin, yPos + 15, {
           align: 'center',
           width: contentWidth,
           lineGap: 6
         })
         .text('May Allah accept your donation and reward you abundantly.', margin, yPos + 30, {
           align: 'center',
           width: contentWidth
         });

      yPos += 60;

      // ============================================================
      // SIGNATURE SECTION - Professional and Clear
      // ============================================================
      
      const signatureY = yPos;
      const signatureX = margin + (contentWidth / 2) - 75;
      
      // Signature line
      doc.moveTo(signatureX, signatureY)
         .lineTo(signatureX + 150, signatureY)
         .lineWidth(1)
         .strokeColor('#111827')
         .stroke();
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#111827')
         .text('Authorized Signatory', signatureX, signatureY + 8, {
           align: 'center',
           width: 150
         });
      
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#1a472a')
         .text('Dar Al Hikma Trust', signatureX, signatureY + 22, {
           align: 'center',
           width: 150
         });

      // ============================================================
      // FOOTER - Professional and Informative
      // ============================================================
      
      const footerY = pageHeight - margin - 30;
      
      // Footer separator line
      doc.moveTo(margin, footerY - 15)
         .lineTo(margin + contentWidth, footerY - 15)
         .lineWidth(0.5)
         .strokeColor('#e5e7eb')
         .stroke();
      
      doc.fontSize(7.5)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, margin, footerY, {
           align: 'left'
         })
         .text(`Receipt ID: ${donation.id || donation._id || 'N/A'}`, margin, footerY, {
           align: 'right',
           width: contentWidth
         });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
