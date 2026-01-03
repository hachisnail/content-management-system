import nodemailer from 'nodemailer';
import { mailerConfig } from '../config/mailer.js';
import { config } from '../config/env.js';

let transporter;

if (config.app.env !== 'production') {
  // For development, use a JSON transport to avoid needing a real SMTP server
  transporter = nodemailer.createTransport({
    jsonTransport: true,
  });
} else {
  transporter = nodemailer.createTransport(mailerConfig);
}

export const sendMail = async (mailOptions) => {
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    if (config.app.env !== 'production') {
      console.log('Email content:', info.message);
    }
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
