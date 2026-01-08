import nodemailer from 'nodemailer';
import { mailerConfig } from '../config/mailer.js';
import { config } from '../config/env.js';

let transporter;

// Initialize Transport based on credentials availability
if (mailerConfig.host && mailerConfig.auth.user) {
  console.log(`[Mailer] Initializing SMTP Transport with host: ${mailerConfig.host}`);
  transporter = nodemailer.createTransport(mailerConfig);
} else {
  console.log('[Mailer] No SMTP credentials found. Using JSON transport (Fake Mail).');
  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
}

export const sendMail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    
    // FIX: Log the input 'mailOptions' instead of 'info.message'
    // This ensures you see the content regardless of the transport used.
    if (config.app.env !== 'production') {
      console.log('--- EMAIL SENT ---');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      // Log a preview of the HTML to avoid cluttering the console too much
      console.log('HTML Preview:', mailOptions.html ? mailOptions.html.substring(0, 100) + '...' : 'No HTML');
      console.log('------------------');
    }
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};