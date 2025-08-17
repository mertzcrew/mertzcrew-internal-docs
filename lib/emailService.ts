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
    subject: 'New Policy Assignment',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Policy Assignment Notification</h2>
        <p>Hello ${userName},</p>
        <p>A new policy has been assigned to you:</p>
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
      
      A new policy has been assigned to you: ${policyTitle}
      
      Please review this policy at your earliest convenience.
      
      View Policy: ${policyUrl}
      
      If you have any questions, please contact your administrator.
      
      This is an automated notification from your policy management system.
    `
  }),
  
  draftPolicyCreated: (userName: string, policyTitle: string, creatorName: string, policyUrl: string) => ({
    subject: 'New Draft Policy Created',
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