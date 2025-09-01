import nodemailer from 'nodemailer';

// Email service configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'apikey', // This is the default username for SendGrid
    pass: process.env.SENDGRID_API_KEY || '', // Your SendGrid API key
  },
});

// Email templates
export const emailTemplates = {
  policyAssigned: (userName: string, policyTitle: string, policyUrl: string) => ({
    subject: 'Mertz Control Room - New Policy Assignment',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Policy Assignment Notification</h2>
        <p>Hello ${userName},</p>
        <p>A new policy has been assigned to you in the Mertz Control Room:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #555;">${policyTitle}</h3>
          <p style="margin-bottom: 20px;">Please review this policy at your earliest convenience.</p>
          <a href="${policyUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View Policy
          </a>
        </div>
        <p>If you have any questions, please contact your administrator.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from your policy management system.
        </p>
      </div>
    `,
    text: `
      Policy Assignment Notification
      
      Hello ${userName},
      
      A new policy has been assigned to you: ${policyTitle} in the Mertz Control Room
      
      Please review this policy at your earliest convenience.
      
      View Policy: ${policyUrl}
      
      If you have any questions, please contact your administrator.
      
      This is an automated notification from your policy management system.
    `
  }),
  
  draftPolicyCreated: (userName: string, policyTitle: string, creatorName: string, policyUrl: string) => ({
    subject: 'Mertz Control Room - New Draft Policy Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Draft Policy Notification</h2>
        <p>Hello ${userName},</p>
        <p>A new draft policy has been created:</p>
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #856404;">${policyTitle}</h3>
          <p style="margin-bottom: 10px; color: #856404;"><strong>Created by:</strong> ${creatorName}</p>
          <p style="margin-bottom: 20px; color: #856404;">This draft policy is currently under review and will be published once approved by an administrator.</p>
          <a href="${policyUrl}" style="background-color: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Review Draft Policy
          </a>
        </div>
        <p>As an admin or assigned user, you can review and provide feedback on this draft policy.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from your policy management system.
        </p>
      </div>
    `,
    text: `
      Draft Policy Notification
      
      Hello ${userName},
      
      A new draft policy has been created: ${policyTitle}
      
      Created by: ${creatorName}
      
      This draft policy is currently under review and will be published once approved by an administrator.
      
      Review Draft Policy: ${policyUrl}
      
      As an admin or assigned user, you can review and provide feedback on this draft policy.
      
      This is an automated notification from your policy management system.
    `
  }),

  policyReadyForReview: (adminUserName: string, policyTitle: string, fromUserName: string, policyUrl: string) => ({
    subject: 'Mertz Control Room - Policy Ready for Review and Publishing',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Policy Review Request</h2>
        <p>Hello ${adminUserName},</p>
        <p><strong>${fromUserName}</strong> has assigned you a policy that is ready to be reviewed for publishing:</p>
        <div style="background-color: #d1ecf1; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
          <h3 style="margin-top: 0; color: #0c5460;">${policyTitle}</h3>
          <p style="margin-bottom: 10px; color: #0c5460;"><strong>Assigned by:</strong> ${fromUserName}</p>
          <p style="margin-bottom: 20px; color: #0c5460;">This policy has been marked as ready for review and publishing. Please review the content and publish it if it meets all requirements.</p>
          <a href="${policyUrl}" style="background-color: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Review and Publish Policy
          </a>
        </div>
        <p>As an admin, you have the authority to review and publish this policy. Please ensure all content meets organizational standards before publishing.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from your policy management system.
        </p>
      </div>
    `,
    text: `
      Policy Review Request
      
      Hello ${adminUserName},
      
      ${fromUserName} has assigned you a policy that is ready to be reviewed for publishing: ${policyTitle}
      
      Assigned by: ${fromUserName}
      
      This policy has been marked as ready for review and publishing. Please review the content and publish it if it meets all requirements.
      
      Review and Publish Policy: ${policyUrl}
      
      As an admin, you have the authority to review and publish this policy. Please ensure all content meets organizational standards before publishing.
      
      This is an automated notification from your policy management system.
    `
  }),

  passwordReset: (userName: string, resetUrl: string) => ({
    subject: 'Mertz Control Room - Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>We received a request to reset your password for your Mertz Control Room account.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
          <p style="margin-bottom: 20px; color: #495057;">Click the button below to reset your password. This link will expire in 1 hour.</p>
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #6c757d; font-size: 14px;">
          <strong>Important:</strong> If you didn't request this password reset, please ignore this email. 
          Your password will remain unchanged.
        </p>
        <p style="color: #6c757d; font-size: 14px;">
          For security reasons, this link will expire in 1 hour. If you need to reset your password after that, 
          please request a new reset link.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email from the Mertz Control Room system. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `
      Password Reset Request
      
      Hello ${userName},
      
      We received a request to reset your password for your Mertz Control Room account.
      
      Click the link below to reset your password. This link will expire in 1 hour.
      
      Reset Password: ${resetUrl}
      
      Important: If you didn't request this password reset, please ignore this email. 
      Your password will remain unchanged.
      
      For security reasons, this link will expire in 1 hour. If you need to reset your password after that, 
      please request a new reset link.
      
      This is an automated email from the Mertz Control Room system. Please do not reply to this email.
    `
  }),

  eventInvitation: (userName: string, fromUserName: string, eventTitle: string, eventDate: string, eventUrl: string) => ({
    subject: 'Mertz Control Room - Event Invitation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Event Invitation</h2>
        <p>Hello ${userName},</p>
        <p>You have been invited to an event by ${fromUserName}.</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #155724;">${eventTitle}</h3>
          <p style="margin-bottom: 10px; color: #155724;"><strong>Date:</strong> ${eventDate}</p>
          <p style="margin-bottom: 20px; color: #155724;">Please click the button below to view the event details and respond to the invitation.</p>
          <a href="${eventUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View Event
          </a>
        </div>
        <p style="color: #6c757d; font-size: 14px;">
          You can accept or decline this invitation by visiting the event page.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email from the Mertz Control Room system. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `
      Event Invitation
      
      Hello ${userName},
      
      You have been invited to an event by ${fromUserName}.
      
      Event: ${eventTitle}
      Date: ${eventDate}
      
      Please visit the following link to view the event details and respond to the invitation:
      ${eventUrl}
      
      You can accept or decline this invitation by visiting the event page.
      
      This is an automated email from the Mertz Control Room system. Please do not reply to this email.
    `
  })
};

// Email sending function
export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  try {
    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SENDGRID_API_KEY not configured. Email not sent.');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@yourdomain.com', // You'll need to set this
      to: to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    };
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Specific function for policy assignment emails
export async function sendPolicyAssignmentEmail(
  userEmail: string, 
  userName: string, 
  policyTitle: string, 
  policyId: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const policyUrl = `${baseUrl}/policy/${policyId}`;
  
  const template = emailTemplates.policyAssigned(userName, policyTitle, policyUrl);
  
  return await sendEmail(userEmail, template.subject, template.html, template.text);
}

// Specific function for draft policy creation emails
export async function sendDraftPolicyCreatedEmail(
  userEmail: string, 
  userName: string, 
  policyTitle: string, 
  creatorName: string,
  policyId: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const policyUrl = `${baseUrl}/policy/${policyId}`;
  
  const template = emailTemplates.draftPolicyCreated(userName, policyTitle, creatorName, policyUrl);
  return await sendEmail(userEmail, template.subject, template.html, template.text);
}

// Specific function for policy ready for review emails
export async function sendPolicyReadyForReviewEmail(
  adminEmail: string, 
  adminUserName: string, 
  policyTitle: string, 
  fromUserName: string,
  policyId: string
) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const policyUrl = `${baseUrl}/policy/${policyId}`;
  
  const template = emailTemplates.policyReadyForReview(adminUserName, policyTitle, fromUserName, policyUrl);
  return await sendEmail(adminEmail, template.subject, template.html, template.text);
}

// Password reset email function
export async function sendPasswordResetEmail(userEmail: string, resetToken: string, userName: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const template = emailTemplates.passwordReset(userName, resetUrl);
  return await sendEmail(userEmail, template.subject, template.html, template.text);
}

// Test email function
export async function testEmailService() {
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  const result = await sendEmail(
    testEmail,
    'Test Email',
    '<h1>Test Email</h1><p>This is a test email from your policy management system.</p>',
    'Test Email\n\nThis is a test email from your policy management system.'
  );
  
  console.log('Test email result:', result);
  return result;
} 

export async function sendEventInvitationEmail(userEmail: string, userName: string, fromUserName: string, eventTitle: string, eventDate: Date, eventId: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const eventUrl = `${baseUrl}/calendar/event/${eventId}`;
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const template = emailTemplates.eventInvitation(userName, fromUserName, eventTitle, formattedDate, eventUrl);
  return await sendEmail(userEmail, template.subject, template.html, template.text);
} 