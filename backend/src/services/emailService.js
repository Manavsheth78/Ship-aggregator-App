import nodemailer from 'nodemailer';
import fs from 'fs';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
  return transporter;
}

export async function sendStatusChangeEmail(to, trackingNumber, status, description, attachmentPath = null) {
  try {
    const transport = getTransporter();
    if (!process.env.SMTP_USER) {
      console.log('[Email] Would send:', { to, trackingNumber, status, description });
      return;
    }
    const subject = attachmentPath
      ? `Your Shipping Label - ${trackingNumber}`
      : `Shipment ${trackingNumber} - ${status}`;
    const textBody = attachmentPath
      ? `Your shipment ${trackingNumber} has been created. Please find your shipping label attached.`
      : `Your shipment ${trackingNumber} has been updated.\n\nStatus: ${status}\n${description || ''}`;
    const htmlBody = attachmentPath
      ? `<p>Your shipment <strong>${trackingNumber}</strong> has been created.</p><p>Please find your shipping label attached to this email.</p>`
      : `<p>Your shipment <strong>${trackingNumber}</strong> has been updated.</p><p><strong>Status:</strong> ${status}</p><p>${description || ''}</p>`;
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Smart Shipment <noreply@smartshipment.com>',
      to,
      subject,
      text: textBody,
      html: htmlBody,
    };
    if (attachmentPath) {
      mailOptions.attachments = [{ filename: 'shipping-label.pdf', content: fs.createReadStream(attachmentPath) }];
    }
    await transport.sendMail(mailOptions);
  } catch (e) {
    console.error('Email send failed:', e.message);
  }
}
