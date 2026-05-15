const nodemailer = require('nodemailer');
const path = require('path');

let commonTransporter = null;
let itTransporter = null;
let managerTransporter = null;
let hrTransporter = null;

function isSmtpConfigured(prefix) {
  const host = process.env[`${prefix}_HOST`];
  const port = process.env[`${prefix}_PORT`];
  const user = process.env[`${prefix}_USER`];
  const pass = process.env[`${prefix}_PASSWORD`];
  return Boolean(host && port && user && pass);
}

function getTransporter(type = 'COMMON') {
  // type can be 'COMMON', 'IT', or 'MANAGER'
  const prefix = `${type}_SMTP`;
  
  if (!isSmtpConfigured(prefix)) {
    console.warn(`SMTP ${prefix} is not configured.`);
    return null;
  }

  // Cache transporters
  if (type === 'MANAGER' && managerTransporter) return managerTransporter;
  if (type === 'IT' && itTransporter) return itTransporter;
  if (type === 'COMMON' && commonTransporter) return commonTransporter;
  if (type === 'HR' && hrTransporter) return hrTransporter;

  const newTransporter = nodemailer.createTransport({
    host: process.env[`${prefix}_HOST`],
    port: parseInt(process.env[`${prefix}_PORT`] || '587', 10),
    secure: String(process.env[`${prefix}_SECURE`] || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env[`${prefix}_USER`],
      pass: process.env[`${prefix}_PASSWORD`],
    },
  });

  if (type === 'MANAGER') managerTransporter = newTransporter;
  else if (type === 'IT') itTransporter = newTransporter;
  else if (type === 'HR') hrTransporter = newTransporter;
  else commonTransporter = newTransporter;

  return newTransporter;
}

async function sendWorkflowEmail({ to, subject, lines, html, type = 'COMMON', attachments }) {
  const smtpTransporter = getTransporter(type);
  const prefix = `${type}_SMTP`;

  if (!smtpTransporter) {
    console.warn(`SMTP ${prefix} is not configured. Skipping email send for subject: ${subject}`);
    return { sent: false, skipped: true };
  }

  const mailOptions = {
    from: process.env[`${prefix}_FROM`] || process.env[`${prefix}_USER`],
    to,
    subject,
    text: lines ? lines.filter(Boolean).join('\n') : '',
    html: html || null,
  };

  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments;
  }

  const info = await smtpTransporter.sendMail(mailOptions);

  return {
    sent: true,
    messageId: info.messageId,
  };
}

async function sendManagerApprovalEmail({ to, employeeName, managerName, managerDesignation }) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1a3a6b; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">Onboarding Approved</h2>
      </div>
      <div style="padding: 30px;">
        <p>Dear <strong>${employeeName}</strong>,</p>
        
        <p>We are pleased to inform you that your joining request has been reviewed and approved by management.</p>
        
        <p>Welcome to the team. We are excited to have you onboard and look forward to your valuable contributions to the organization.</p>
        
        <p>Kindly connect with HR and your reporting manager for further onboarding formalities, access setup, and initial assignments.</p>
        
        <p>Wishing you success in your new role.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 0; font-weight: bold;">Best Regards,</p>
          <p style="margin: 5px 0 0 0; color: #1a3a6b; font-size: 16px;">${managerName}</p>
          <p style="margin: 2px 0 0 0; color: #666; font-size: 14px;">${managerDesignation}</p>
        </div>
      </div>
      <div style="background-color: #f9f9f9; padding: 15px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee;">
        Powered by OnboardFlow & Temporal Technologies
      </div>
    </div>
  `;

  return sendWorkflowEmail({
    to,
    subject: `Joining Approved: Welcome to the Team, ${employeeName}!`,
    html,
    type: 'MANAGER', // Send from manager's SMTP account
  });
}

async function sendCredentialsEmail({ to, employeeName, corporateEmail, temporaryPassword, manager }) {
  const html = `
    <div style="font-family: sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
      <h2 style="color: #2563eb;">Your Work Credentials</h2>
      <p>Hello <strong>${employeeName}</strong>,</p>
      <p>Your onboarding is almost complete. Here are your new corporate account details:</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Work Email:</strong> ${corporateEmail}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 4px; border-radius: 4px;">${temporaryPassword}</code></p>
      </div>
      <p>Please sign in and change your password immediately.</p>
      ${manager ? `<p>Reporting Manager: ${manager}</p>` : ''}
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #64748b; font-size: 14px;">Regards,<br>OnboardFlow HR Team</p>
    </div>
  `;

  return sendWorkflowEmail({
    to,
    subject: 'Your OnboardFlow work email credentials',
    html,
    type: 'HR', // Send credentials from HR account
    attachments: [
      {
        filename: 'Employee_BGV_Form_Empty.docx',
        path: path.join(__dirname, '..', 'data', 'Employee_BGV_Form_Empty.docx')
      }
    ]
  });
}

async function sendManagerApprovalRequestEmail({ to, managerName, employeeName, employeeId, role, department, joiningDate, approvalUrl }) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1a3a6b; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">Onboarding Approval Request</h2>
      </div>
      <div style="padding: 30px;">
        <p>Dear <strong>${managerName}</strong>,</p>
        
        <p>This is an automated notification regarding the onboarding process for a new employee.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Employee Name:</strong> ${employeeName}</p>
          <p style="margin: 5px 0;"><strong>Employee ID:</strong> ${employeeId}</p>
          <p style="margin: 5px 0;"><strong>Designation:</strong> ${role}</p>
          <p style="margin: 5px 0;"><strong>Department:</strong> ${department}</p>
          <p style="margin: 5px 0;"><strong>Date of Joining:</strong> ${joiningDate}</p>
        </div>
        
        <p>Kindly review the employee details and provide your approval to proceed with the onboarding process, system access creation, and related formalities.</p>
        
        <p>Please approve at your earliest convenience to ensure a smooth joining experience.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review & Approve Onboarding</a>
        </div>
        
        <p>Thank you.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 0; font-weight: bold;">Best Regards,</p>
          <p style="margin: 5px 0 0 0; color: #1a3a6b;">HR / Recruitment Team</p>
          <p style="margin: 2px 0 0 0; color: #666; font-size: 14px;">OnboardFlow Corporate</p>
        </div>
      </div>
    </div>
  `;

  return sendWorkflowEmail({
    to,
    subject: `Action Required: Onboarding Approval for ${employeeName}`,
    html,
    type: 'COMMON', // Use the HR/System SMTP credentials (cmsh800@gmail.com)
  });
}

async function sendITApprovalRequestEmail({ to, employeeName, employeeId, role, department, laptop, approvalUrl }) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1a3a6b; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">IT Provisioning Approval Request</h2>
      </div>
      <div style="padding: 30px;">
        <p>Dear <strong>IT Team</strong>,</p>
        
        <p>A new employee onboarding request has been approved by the manager. Please review the IT provisioning requirements.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Employee Name:</strong> ${employeeName}</p>
          <p style="margin: 5px 0;"><strong>Employee ID:</strong> ${employeeId}</p>
          <p style="margin: 5px 0;"><strong>Department:</strong> ${department}</p>
          <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
          <p style="margin: 5px 0;"><strong>Requested Laptop:</strong> ${laptop}</p>
        </div>
        
        <p>Please review and approve the request to trigger the automated creation of the corporate email and access rights.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review & Approve IT Request</a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 0; font-weight: bold;">Best Regards,</p>
          <p style="margin: 5px 0 0 0; color: #1a3a6b;">HR / Recruitment Team</p>
        </div>
      </div>
    </div>
  `;

  return sendWorkflowEmail({
    to,
    subject: `Action Required: IT Provisioning Approval for ${employeeName}`,
    html,
    type: 'COMMON', // From cmsh800 to IT mail as requested
  });
}
async function sendHRApprovalRequestEmail({ to, employeeName, employeeId, role, department, corporateEmail, approvalUrl }) {
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1a3a6b; padding: 20px; text-align: center;">
        <h2 style="color: #ffffff; margin: 0;">HR Final Approval Request</h2>
      </div>
      <div style="padding: 30px;">
        <p>Dear <strong>HR Team</strong>,</p>
        
        <p>IT provisioning and manager approval are complete. Please review the final details before we release the welcome email and access rights.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Employee Name:</strong> ${employeeName}</p>
          <p style="margin: 5px 0;"><strong>Employee ID:</strong> ${employeeId}</p>
          <p style="margin: 5px 0;"><strong>Department:</strong> ${department}</p>
          <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
          <p style="margin: 5px 0;"><strong>Corporate Email:</strong> ${corporateEmail}</p>
        </div>
        
        <p>Your approval will trigger the final welcome email to the employee with their credentials.</p>
        
        <p style="font-size: 11px; color: #94a3b8; background: #f1f5f9; padding: 8px; border-radius: 4px; margin: 16px 0;">
          <strong>Note:</strong> Access to the approval portal is restricted to authorized HR personnel only. Please ensure you are logged in as <em>harsha.hr.ti@gmail.com</em>.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Review & Approve HR Request</a>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="margin: 0; font-weight: bold;">Best Regards,</p>
          <p style="margin: 5px 0 0 0; color: #1a3a6b;">OnboardFlow System</p>
        </div>
      </div>
    </div>
  `;

  return sendWorkflowEmail({
    to,
    subject: `Action Required: Final HR Approval for ${employeeName}`,
    html,
    type: 'COMMON', // From cmsh800 to hr mail as requested
  });
}

/**
 * Enhanced Welcome Email sent after Bank & Insurance submission
 * Includes Office Details and Onboarding PPT
 */
async function sendFinalWelcomeEmail({ to, employeeName }) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  const pptDownloadUrl = `${backendUrl}/api/downloads/onboarding-ppt`;

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">Welcome to TechnoIdentity! 🚀</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">We're thrilled to have you join our team.</p>
      </div>
      
      <div style="padding: 32px 24px; background: #ffffff;">
        <p>Hello <strong>${employeeName}</strong>,</p>
        <p>Congratulations! You have successfully completed all the onboarding formalities, including insurance and banking details submission. You are now officially part of the TechnoIdentity family.</p>
        
        <div style="margin: 32px 0; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #1e3a8a; font-size: 18px;">📍 Our Office Locations</h3>
          
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; font-weight: 700; color: #334155;">Jubilee Hills Office (Headquarters)</p>
            <p style="margin: 4px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
              3rd Floor, Sai Prasanthi Towers, Road No. 92,<br>
              Jubilee Hills, Hyderabad – 500034, Telangana, India
            </p>
          </div>
          
          <div>
            <p style="margin: 0; font-weight: 700; color: #334155;">Kondapur Office</p>
            <p style="margin: 4px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
              4th Floor, DHFL VC Silicon Tower, Jayabheri Silicon Towers,<br>
              Hitech City Road, Kondapur, Hyderabad – 500084, Telangana, India
            </p>
          </div>
        </div>
        
        <div style="background: #eff6ff; padding: 20px; border-radius: 12px; border-left: 4px solid #2563eb; margin-bottom: 32px;">
          <p style="margin: 0; font-weight: 700; color: #1e40af;">🏢 Join the Team at the Office!</p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #1e3a8a;">
            We can't wait to see you at the office. Please coordinate with your manager for your first day schedule and seating arrangement.
          </p>
        </div>

        <div style="text-align: center; margin: 32px 0; padding: 20px; border: 2px dashed #e2e8f0; border-radius: 12px;">
          <p style="margin: 0 0 16px; font-weight: 600; color: #475569;">Explore our Culture & Induction Materials</p>
          <a href="${pptDownloadUrl}" style="background: #1e293b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 14px;">
            📂 Download Onboarding Presentation
          </a>
          <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">(Also attached to this email for your convenience)</p>
        </div>
        
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-weight: bold; font-size: 14px;">Best Regards,</p>
          <p style="margin: 4px 0 0; color: #1e3a8a; font-size: 16px; font-weight: 700;">HR Team</p>
          <p style="margin: 0; color: #64748b; font-size: 13px;">TechnoIdentity Solutions</p>
        </div>
      </div>
      
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
        This is an automated message from the OnboardFlow System.
      </div>
    </div>
  `;

  return sendWorkflowEmail({
    to,
    subject: `Welcome to the TechnoIdentity Team! 🚀`,
    html,
    type: 'HR',
    attachments: [
      {
        filename: 'Technoidentity_Onboarding.pptx',
        path: path.join(__dirname, '..', 'data', 'Technoidentity_Onboarding.pptx')
      }
    ]
  });
}

/**
 * Send Password Reset Link Email
 */
async function sendPasswordResetEmail({ to, employeeName, resetLink }) {
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background: #1e293b; padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Reset Your Password</h1>
      </div>
      
      <div style="padding: 32px 24px; background: #ffffff;">
        <p>Hello <strong>${employeeName}</strong>,</p>
        <p>We received a request to reset the password for your OnboardFlow account. Click the button below to choose a new password:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 14px;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">If you didn't request this, you can safely ignore this email. This link is for one-time use only.</p>
        
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-weight: bold; font-size: 14px;">Best Regards,</p>
          <p style="margin: 4px 0; color: #1e3a8a; font-size: 16px; font-weight: 700;">OnboardFlow Team</p>
        </div>
      </div>
      
      <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
        This is an automated message from the OnboardFlow System.
      </div>
    </div>
  `;

  return sendWorkflowEmail({
    to,
    subject: 'Reset your OnboardFlow password',
    html,
    type: 'COMMON',
  });
}

module.exports = {
  isSmtpConfigured,
  sendWorkflowEmail,
  sendCredentialsEmail,
  sendManagerApprovalEmail,
  sendManagerApprovalRequestEmail,
  sendITApprovalRequestEmail,
  sendHRApprovalRequestEmail,
  sendFinalWelcomeEmail,
  sendPasswordResetEmail,
};
