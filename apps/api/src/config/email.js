import nodemailer from 'nodemailer';
import { config } from './env.js';

// 1. Create Transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// 2. Verify Connection (Optional but recommended)
if (config.env !== 'test') {
  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP Connection Error:', error.message);
    } else {
      console.log('SMTP Server is ready to take our messages');
    }
  });
}

/**
 * Send an Invitation Email
 * @param {string} email - Recipient
 * @param {string} token - Invite Token
 */
export const sendInvitationEmail = async (email, token) => {
  // Construct the link (Adjust domain based on environment if needed)
  const clientUrl = config.env === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:5173';
    
  const inviteLink = `${clientUrl}/accept-invite?token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: config.email.from,
      to: email,
      subject: 'You have been invited to the Museum CMS',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to Museum CMS</h2>
          <p>You have been invited to join the platform. Please click the button below to set up your account:</p>
          <a href="${inviteLink}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">Accept Invitation</a>
          <p>Or copy this link: <br> ${inviteLink}</p>
          <p>This link will expire in 48 hours.</p>
        </div>
      `,
    });

    console.log(`📧 Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't crash the request, just log it. 
    // In strict systems, you might want to throw here.
    return false;
  }
};

/**
 * Generic Send Function (For future use like Password Reset)
 */
export const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });
};