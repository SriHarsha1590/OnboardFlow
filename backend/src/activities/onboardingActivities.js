const { activityInfo, heartbeat } = require('@temporalio/activity');
const pool = require('../db/pool');
const { sendCredentialsEmail, sendWorkflowEmail, sendManagerApprovalEmail, sendManagerApprovalRequestEmail, sendITApprovalRequestEmail, sendHRApprovalRequestEmail } = require('../utils/mailer');

// Helper to simulate async work with heartbeat
async function simulateWork(ms, label) {
  console.log(`  ⚙️  [Activity] ${label} - starting...`);
  await new Promise(r => setTimeout(r, ms));
  console.log(`  ✅ [Activity] ${label} - done`);
}

// Helper to update activity record in DB
async function recordActivity(workflowDbId, activityName, stepIndex, status, result = null, error = null, retryCount = 0) {
  try {
    const existing = await pool.query(
      'SELECT id FROM workflow_activities WHERE workflow_id = (SELECT id FROM workflows WHERE workflow_id = $1) AND activity_index = $2',
      [workflowDbId, stepIndex]
    );

    const workflowRow = await pool.query('SELECT id FROM workflows WHERE workflow_id = $1', [workflowDbId]);
    if (!workflowRow.rows[0]) return;
    const wfId = workflowRow.rows[0].id;

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE workflow_activities SET status = $1, result = $2, error_message = $3, retry_count = $4,
         started_at = CASE WHEN $1 = 'RUNNING' THEN NOW() ELSE started_at END,
         completed_at = CASE WHEN $1 IN ('COMPLETED','FAILED') THEN NOW() ELSE completed_at END
         WHERE workflow_id = $5 AND activity_index = $6`,
        [status, result ? JSON.stringify(result) : null, error, retryCount, wfId, stepIndex]
      );
    } else {
      await pool.query(
        `INSERT INTO workflow_activities (workflow_id, activity_name, activity_index, status, result, error_message, retry_count, started_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [wfId, activityName, stepIndex, status, result ? JSON.stringify(result) : null, error, retryCount]
      );
    }
  } catch (err) {
    console.error('Failed to record activity:', err.message);
  }
}

async function initializeOnboarding({ employeeId, workflowDbId, name, personalEmail, department }) {
  console.log(`🚀 [initializeOnboarding] Starting for ${name}`);
  await simulateWork(800, 'Initialize onboarding record');

  // Generate employee ID
  const empCode = department.substring(0, 3).toUpperCase();
  const empNum = Math.floor(Math.random() * 9000) + 1000;
  const generatedEmpId = `${empCode}-${empNum}`;

  await pool.query('UPDATE employees SET employee_id = $1 WHERE id = $2', [generatedEmpId, employeeId]);

  await pool.query(
    `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, 'WORKFLOW_INITIALIZED', 'system', $2)`,
    [employeeId, JSON.stringify({ workflowId: workflowDbId, generatedEmpId })]
  );

  console.log(`✅ [initializeOnboarding] Employee ID assigned: ${generatedEmpId}`);
  return { employeeId: generatedEmpId };
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 12; i += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return password;
}

async function createEmailAccount({ employeeId, workflowDbId, name, personalEmail, department }) {
  const info = activityInfo();
  const attempt = info.attempt;
  console.log(`📧 [createEmailAccount] Attempt ${attempt} for ${name}`);

  // Demo: Simulate failure on first attempt to show Temporal retry
  if (attempt === 1 && Math.random() < 0.5) {
    console.log('⚠️  [createEmailAccount] Simulating transient failure (will auto-retry)');
    await recordActivity(workflowDbId, 'createEmailAccount', 2, 'RUNNING', null, null, attempt);
    throw new Error('SMTP connection timeout - will retry automatically');
  }

  await simulateWork(1200, `Creating email account for ${name}`);

  const nameParts = name.toLowerCase().split(' ');
  const corpEmail = `${nameParts[0]}.${nameParts[nameParts.length - 1]}${Math.floor(Math.random() * 900) + 100}@company.com`;
  const temporaryPassword = generateTemporaryPassword();

  heartbeat('Email account provisioned');

  await pool.query(
    'UPDATE employees SET work_email = $1, temporary_password = $2 WHERE id = $3',
    [corpEmail, temporaryPassword, employeeId]
  );

  await pool.query(
    `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, 'EMAIL_CREATED', 'it-system', $2)`,
    [employeeId, JSON.stringify({ personalEmail, corporateEmail: corpEmail, temporaryPassword, attempt })]
  );

  console.log(`✅ [createEmailAccount] Created: ${corpEmail} (attempt ${attempt})`);
  return { corporateEmail: corpEmail, temporaryPassword, provider: 'Google Workspace', attempt };
}

async function sendManagerApprovalRequest({ manager, managerEmail, employeeName, employeeId, role, department, joiningDate }) {
  console.log(`📨 [sendManagerApprovalRequest] Sending request to ${managerEmail} for ${employeeName}`);
  await simulateWork(400, 'Sending manager approval request email');

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const approvalUrl = `${frontendUrl}/approvals`;

  const mailResult = await sendManagerApprovalRequestEmail({
    to: managerEmail,
    managerName: manager,
    employeeName,
    employeeId,
    role,
    department,
    joiningDate,
    approvalUrl,
  });

  return { sent: true, mailResult };
}

async function sendITApprovalRequest({ itEmail, employeeName, employeeId, role, department, laptop }) {
  console.log(`📨 [sendITApprovalRequest] Sending IT provisioning request to ${itEmail} for ${employeeName}`);
  await simulateWork(400, 'Sending IT approval request email');

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const approvalUrl = `${frontendUrl}/it-approvals/${employeeId}`; // Direct link to the new IT page

  const mailResult = await sendITApprovalRequestEmail({
    to: itEmail,
    employeeName,
    employeeId,
    role,
    department,
    laptop,
    approvalUrl,
  });

  return { sent: true, mailResult };
}

async function sendHRApprovalRequest({ hrEmail, employeeName, employeeId, role, department, corporateEmail }) {
  console.log(`📨 [sendHRApprovalRequest] Sending HR final request to ${hrEmail} for ${employeeName}`);
  await simulateWork(400, 'Sending HR approval request email');

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const approvalUrl = `${frontendUrl}/hr-approvals/${employeeId}`;

  const mailResult = await sendHRApprovalRequestEmail({
    to: hrEmail,
    employeeName,
    employeeId,
    role,
    department,
    corporateEmail,
    approvalUrl,
  });

  return { sent: true, mailResult };
}

async function sendManagerApprovalConfirmation({ employeeId, name, personalEmail, manager }) {
  console.log(`📨 [sendManagerApprovalConfirmation] Sending approval email to ${personalEmail}`);
  await simulateWork(400, 'Sending manager approval email');

  // Fetch manager's designation from database
  let designation = 'Reporting Manager';
  try {
    const { rows } = await pool.query('SELECT role FROM managers WHERE name = $1 LIMIT 1', [manager]);
    if (rows[0]) designation = rows[0].role;
  } catch (err) {
    console.error('Error fetching manager designation:', err.message);
  }

  const mailResult = await sendManagerApprovalEmail({
    to: personalEmail,
    employeeName: name,
    managerName: manager,
    managerDesignation: designation,
  });

  await pool.query(
    `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, 'MANAGER_APPROVAL_CONFIRMATION_SENT', 'email-system', $2)`,
    [employeeId, JSON.stringify({ to: personalEmail, manager, designation, mailResult })]
  );

  return { sent: true, manager, designation };
}

async function sendWorkflowUpdateEmail({ employeeId, name, personalEmail, stage, manager, corporateEmail, temporaryPassword }) {
  console.log(`📨 [sendWorkflowUpdateEmail] Sending ${stage} update to ${personalEmail}`);
  await simulateWork(400, `Sending ${stage} email update`);

  const stageTemplates = {
    managerApproved: {
      subject: `Welcome to the Team, ${name}! Your Work Credentials`,
      html: `
        <div style="font-family: 'Sora', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 32px 24px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Welcome to the Team!</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Your onboarding is moving forward</p>
          </div>
          <div style="padding: 32px 24px; background: #ffffff;">
            <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
            <p>Your manager has approved your onboarding request. IT is currently reviewing your laptop request and provisioning your system access. We'll notify you once those steps are complete.</p>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-weight: bold; font-size: 14px;">Best Regards,</p>
              <p style="margin: 4px 0 0; color: #1e3a8a; font-size: 15px; font-weight: 600;">HR / Recruitment Team</p>
              <p style="margin: 0; color: #64748b; font-size: 13px;">OnboardFlow Corporate</p>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
            Powered by OnboardFlow & Temporal Technologies
          </div>
        </div>
      `,
      action: 'MANAGER_APPROVAL_EMAIL_SENT',
    },
    itApproved: {
      subject: `Welcome to the Team, ${name}! Your IT Setup & Work Credentials`,
      html: `
        <div style="font-family: 'Sora', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 32px 24px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">IT Setup Complete!</h2>
          </div>
          <div style="padding: 32px 24px; background: #ffffff;">
            <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
            <p>IT has approved your laptop request and provisioned your corporate accounts.</p>
            
            <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 24px 0;">
              <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">SECURE CREDENTIALS</div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">CORPORATE EMAIL</label>
                <div style="font-family: monospace; font-size: 15px; color: #1e293b; font-weight: 600;">${corporateEmail}</div>
              </div>
              <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px;">TEMPORARY PASSWORD</label>
                <div style="font-family: monospace; font-size: 15px; color: #2563eb; font-weight: 700; background: #eff6ff; padding: 4px 8px; border-radius: 4px; display: inline-block;">${temporaryPassword}</div>
              </div>
              <p style="font-size: 12px; color: #64748b; margin: 0; font-style: italic;">Please sign in to change your password.</p>
            </div>

            <p>HR review for access rights and payroll will follow next.</p>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-weight: bold; font-size: 14px;">Best Regards,</p>
              <p style="margin: 4px 0 0; color: #1e3a8a; font-size: 15px; font-weight: 600;">IT Team</p>
              <p style="margin: 0; color: #64748b; font-size: 13px;">OnboardFlow Corporate</p>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
            Powered by OnboardFlow & Temporal Technologies
          </div>
        </div>
      `,
      action: 'IT_APPROVAL_EMAIL_SENT',
    },
    accessRightsReady: {
      subject: `${name}, Your Access Rights & Benefits Portal is Ready!`,
      html: `
        <div style="font-family: 'Sora', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 32px 24px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Access Rights Activated!</h2>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Your system access and team resources are ready</p>
          </div>
          <div style="padding: 32px 24px; background: #ffffff;">
            <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
            <p>Congratulations! HR has completed your vetting and your access rights have been provisioned. You now have access to all the tools and platforms required for your role.</p>
            
            <div style="text-align: center; margin: 28px 0;">
              <a href="https://chat.whatsapp.com/F1Kjxa3rdrsJjuUhZONQKk" style="background: linear-gradient(135deg, #25D366, #128C7E); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 14px; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(37,211,102,0.3);">
                🟢 Join WhatsApp Group
              </a>
            </div>

            <div style="text-align: center; margin: 20px 0;">
              <a href="https://teams.microsoft.com/l/team/19%3aMEEgZjRhOTkzYTMtNDBjYi00ZDRmLTg2NTMtN2QxYjFlYTk0ZjA1%40thread.tacv2/conversations?groupId=onboardflow-welcome" style="background: linear-gradient(135deg, #5B5FC7, #4B53BC); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 14px; margin-bottom: 12px;">
                🟣 Join Microsoft Teams Group
              </a>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/onboarding-portal/${employeeId}" style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 14px;">
                📋 Open Access Rights & Benefits Portal
              </a>
            </div>
            
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Next Steps:</strong></p>
              <ol style="margin: 8px 0 0; padding-left: 18px; font-size: 13px; color: #64748b;">
                <li>Review your benefits, bonus structures, and insurance policies</li>
                <li>Submit insurance dependents for group medical coverage</li>
                <li>Submit your banking details for salary processing</li>
              </ol>
            </div>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-weight: bold; font-size: 14px;">Best Regards,</p>
              <p style="margin: 4px 0 0; color: #059669; font-size: 15px; font-weight: 600;">HR Team</p>
              <p style="margin: 0; color: #64748b; font-size: 13px;">OnboardFlow Corporate</p>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
            Powered by OnboardFlow & Temporal Technologies
          </div>
        </div>
      `,
      action: 'ACCESS_RIGHTS_EMAIL_SENT',
    },
    bankingRequest: {
      subject: `${name}, Please Submit Your Banking Details`,
      html: `
        <div style="font-family: 'Sora', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 32px 24px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Banking Details Required</h2>
          </div>
          <div style="padding: 32px 24px; background: #ffffff;">
            <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>
            <p>Thank you for submitting your insurance dependents. As the final step, please submit your banking details for salary processing.</p>
            
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="margin: 0 0 12px; font-weight: 700; font-size: 13px; color: #1e293b;">Required Information:</p>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #64748b; line-height: 1.8;">
                <li>Account Holder Name</li>
                <li>Bank Name</li>
                <li>Account Number</li>
                <li>IFSC Code</li>
                <li>Branch</li>
                <li>PAN Number</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 28px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/onboarding-portal/${employeeId}" style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; font-size: 14px;">
                Submit Banking Details
              </a>
            </div>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-weight: bold; font-size: 14px;">Best Regards,</p>
              <p style="margin: 4px 0 0; color: #1e3a8a; font-size: 15px; font-weight: 600;">HR Team</p>
              <p style="margin: 0; color: #64748b; font-size: 13px;">OnboardFlow Corporate</p>
            </div>
          </div>
          <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
            Powered by OnboardFlow & Temporal Technologies
          </div>
        </div>
      `,
      action: 'BANKING_REQUEST_EMAIL_SENT',
    },
  };

  const template = stageTemplates[stage];
  if (!template) {
    return { sent: false, skipped: true, reason: `Unknown email stage: ${stage}` };
  }

  const mailResult = await sendWorkflowEmail({
    to: personalEmail,
    subject: template.subject,
    lines: template.lines,
    html: template.html,
    type: (stage === 'accessRightsReady' || stage === 'bankingRequest') ? 'COMMON' : 'IT',
  });

  await pool.query(
    `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, $2, 'email-system', $3)`,
    [employeeId, template.action, JSON.stringify({ to: personalEmail, subject: template.subject, stage, corporateEmail, mailResult })]
  );

  console.log(`✅ [sendWorkflowUpdateEmail] ${stage} email sent to ${personalEmail}`);
  return { sent: true, stage, personalEmail, mailResult };
}

async function provisionLaptop({ employeeId, workflowDbId, name, laptop, office }) {
  console.log(`💻 [provisionLaptop] Provisioning ${laptop} for ${name} at ${office}`);
  await simulateWork(1500, 'Creating laptop provision ticket');

  const ticketId = `IT-${Math.floor(Math.random() * 90000) + 10000}`;

  await pool.query(
    `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, 'LAPTOP_PROVISIONED', 'it-system', $2)`,
    [employeeId, JSON.stringify({ ticketId, laptop, office, eta: '3-5 business days' })]
  );

  console.log(`✅ [provisionLaptop] Ticket created: ${ticketId}`);
  return { ticketId, laptop, office, eta: '3-5 business days', status: 'Dispatched' };
}

async function createAccessRights({ employeeId, workflowDbId, name, department, role }) {
  console.log(`🔑 [createAccessRights] Setting up access for ${name} (${department})`);
  await simulateWork(1000, 'Provisioning access rights');

  const accessGroups = {
    'Engineering / Product Development': ['github-org', 'aws-dev', 'jira-eng', 'confluence-eng', 'slack-engineering'],
    'Product / Business Analysis / UX': ['jira-all', 'confluence-all', 'figma', 'analytics', 'slack-product'],
    'Sales / Business Development': ['hubspot', 'google-analytics', 'slack-sales', 'crm', 'proposal-hub'],
    'Finance / Legal / Procurement': ['quickbooks', 'slack-finance', 'excel-online', 'sharepoint-finance'],
    Operations: ['slack-ops', 'jira-ops', 'confluence-all', 'notion', 'gsuite'],
    'Delivery / Client Success': ['jira-delivery', 'confluence-all', 'slack-delivery', 'client-portal'],
    'QA / Testing': ['jira-qa', 'testrail', 'slack-qa', 'confluence-eng'],
    'DevOps / Cloud / SRE': ['aws-prod', 'datadog', 'pagerduty', 'slack-platform', 'github-org'],
    'Data / AI / Analytics': ['snowflake', 'dbt-cloud', 'looker', 'slack-data', 'ml-platform'],
    Cybersecurity: ['siem', 'slack-security', 'vuln-scanner', 'iam-console'],
    'HR / Recruitment / L&D': ['hris', 'slack-people', 'lms', 'recruiting-suite'],
    'IT Support / Internal IT': ['intune', 'jamf', 'helpdesk', 'slack-it'],
    'Admin / Facilities': ['travel-desk', 'visitor-system', 'facilities-portal', 'slack-admin'],
    Engineering: ['github-org', 'aws-dev', 'jira-eng', 'confluence-eng', 'slack-engineering'],
    Product: ['jira-all', 'confluence-all', 'figma', 'analytics', 'slack-product'],
    Design: ['figma-pro', 'adobe-cc', 'confluence-design', 'slack-design', 'zeplin'],
    Marketing: ['hubspot', 'google-analytics', 'slack-marketing', 'canva-pro', 'notion'],
    Finance: ['quickbooks', 'slack-finance', 'excel-online', 'sharepoint-finance'],
  };

  const groups = accessGroups[department] || ['slack-general', 'confluence-all', 'jira-basic'];

  await pool.query(
    `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, 'ACCESS_CREATED', 'iam-system', $2)`,
    [employeeId, JSON.stringify({ groups, department, role })]
  );

  console.log(`✅ [createAccessRights] Granted ${groups.length} access groups`);
  return { groups, vpnEnabled: true, mfaRequired: true };
}

async function notifyPayroll({ employeeId, workflowDbId, name, department, role }) {
  console.log(`💰 [notifyPayroll] Notifying payroll for ${name}`);
  await simulateWork(700, 'Sending payroll notification');

  const payrollRef = `PAY-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;

  await pool.query(
    `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, 'PAYROLL_NOTIFIED', 'payroll-system', $2)`,
    [employeeId, JSON.stringify({ payrollRef, department, role })]
  );

  console.log(`✅ [notifyPayroll] Payroll reference: ${payrollRef}`);
  return { payrollRef, bankDetailsRequired: true, firstPayDate: getNextPayDate() };
}

async function sendWelcomeEmail({ employeeId, workflowDbId, name, personalEmail, manager, department, role, corporateEmail, temporaryPassword }) {
  console.log(`📨 [sendWelcomeEmail] Sending welcome email to ${name}`);
  await simulateWork(600, 'Sending welcome email');

  const mailResult = await sendCredentialsEmail({
    to: personalEmail,
    employeeName: name,
    corporateEmail,
    temporaryPassword,
    manager,
  });

  await pool.query(
    `UPDATE workflows SET status = 'COMPLETED', completed_at = NOW() WHERE workflow_id = $1`,
    [workflowDbId]
  );

  await pool.query(
    `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, 'WELCOME_EMAIL_SENT', 'email-system', $2)`,
    [employeeId, JSON.stringify({
      to: personalEmail,
      cc: `${manager.toLowerCase().replace(' ', '.')}@company.com`,
      subject: 'Your OnboardFlow work email credentials',
      corporateEmail,
      temporaryPassword,
      mailResult,
    })]
  );

  console.log(`✅ [sendWelcomeEmail] Work credentials sent to ${personalEmail}`);
  return { sent: true, timestamp: new Date().toISOString(), personalEmail, corporateEmail, temporaryPassword, mailResult };
}

async function updateWorkflowStep({ workflowDbId, step, stepIndex, status, result, error, status_overall }) {
  try {
    const overallStatus = status_overall
      || (status === 'WAITING_SIGNAL'
        ? 'WAITING_SIGNAL'
        : (status === 'FAILED' || status === 'REJECTED')
          ? 'FAILED'
          : status === 'COMPLETED' && stepIndex === 8
            ? 'COMPLETED'
            : 'RUNNING');

    await pool.query(
      `UPDATE workflows SET current_step = $1, current_step_index = $2, status = $3, updated_at = NOW()
       WHERE workflow_id = $4`,
      [step, stepIndex, overallStatus, workflowDbId]
    );

    // Also update individual activity status in workflow_activities for the timeline
    await recordActivity(workflowDbId, step, stepIndex, status, result, error);

    if (status_overall === 'COMPLETED') {
      await pool.query(`UPDATE workflows SET completed_at = NOW() WHERE workflow_id = $1`, [workflowDbId]);
    }
  } catch (err) {
    console.error('updateWorkflowStep error:', err.message);
  }
}

async function sendManagerReminder({ workflowDbId, manager, employeeName }) {
  console.log(`⏰ [sendManagerReminder] Sending reminder to ${manager} for ${employeeName}`);
  await simulateWork(300, 'Sending manager reminder');

  await pool.query(
    `INSERT INTO audit_logs (employee_id, action, actor, details)
     SELECT employee_id, 'MANAGER_REMINDED', 'system', $1 FROM workflows WHERE workflow_id = $2`,
    [JSON.stringify({ manager, reason: 'Approval pending > 24 hours' }), workflowDbId]
  );

  console.log(`✅ [sendManagerReminder] Reminder sent to ${manager}`);
  return { sent: true };
}

function getNextPayDate() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString().split('T')[0];
}

module.exports = {
  initializeOnboarding,
  createEmailAccount,
  sendWorkflowUpdateEmail,
  provisionLaptop,
  createAccessRights,
  notifyPayroll,
  sendWelcomeEmail,
  sendManagerApprovalConfirmation,
  sendManagerApprovalRequest,
  updateWorkflowStep,
  sendManagerReminder,
  sendITApprovalRequest,
  sendHRApprovalRequest,
};
