/**
 * Temporal Workflow — Employee Onboarding
 *
 * IMPORTANT: Temporal workflows run in a sandboxed V8 isolate.
 * - Only @temporalio/workflow imports are allowed inside workflow code
 * - No Node.js built-ins (fs, path, http, etc.)
 * - No database calls — those go in Activities
 * - This file is bundled by the Temporal Worker automatically via workflowsPath
 */

const {
  proxyActivities,
  defineSignal,
  setHandler,
  condition,
  sleep,
  log,
} = require('@temporalio/workflow');

// ── Signal definitions ────────────────────────────────────────────────────────
const managerApprovalSignal = defineSignal('manager_approval');
const itApprovalSignal = defineSignal('it_approval');
const hrApprovalSignal = defineSignal('hr_approval');

// ── Activity proxies ──────────────────────────────────────────────────────────
const {
  initializeOnboarding,
  createEmailAccount,
  sendWorkflowUpdateEmail,
  provisionLaptop,
  createAccessRights,
  notifyPayroll,
  sendWelcomeEmail,
  sendManagerApprovalConfirmation,
  sendManagerApprovalRequest,
  sendITApprovalRequest,
  updateWorkflowStep,
  sendManagerReminder,
  sendHRApprovalRequest,
} = proxyActivities({
  startToCloseTimeout: '10 minutes',
  retry: {
    maximumAttempts: 3,
    initialInterval: '5s',
    backoffCoefficient: 2,
    maximumInterval: '60s',
    nonRetryableErrorTypes: ['ValidationError'],
  },
});

// ── Main Workflow ─────────────────────────────────────────────────────────────
async function employeeOnboardingWorkflow(employeeData) {
  const { employeeId, workflowDbId, name, personalEmail, department, role, manager, managerEmail, laptop, office, joiningDate } = employeeData;

  log.info('Workflow started', { employeeId, name });

  // Step 0: Initialize
  await updateWorkflowStep({ workflowDbId, step: 'initializeOnboarding', stepIndex: 0, status: 'RUNNING' });
  const initResult = await initializeOnboarding({ employeeId, workflowDbId, name, personalEmail, department });
  await updateWorkflowStep({ workflowDbId, step: 'initializeOnboarding', stepIndex: 0, status: 'COMPLETED', result: initResult });

  // STEP 1: Notify Manager (New detailed template with approval link)
  await sendManagerApprovalRequest({
    manager,
    managerEmail,
    employeeName: name,
    employeeId: initResult.employeeId,
    role,
    department,
    joiningDate,
  });

  // Step 1: Manager approval (human-in-the-loop via signal)
  await updateWorkflowStep({ workflowDbId, step: 'waitForManagerApproval', stepIndex: 1, status: 'WAITING_SIGNAL' });

  let approvalReceived = false;
  let approvalPayload = { approved: false, approvedBy: null, reason: null };

  setHandler(managerApprovalSignal, (payload) => {
    approvalPayload = payload;
    approvalReceived = true;
    log.info('Signal received', { approved: payload.approved, by: payload.approvedBy });
  });

  // Send reminder after 2 minutes if still waiting (production: 24 hours)
  sleep('2m').then(async () => {
    if (!approvalReceived) {
      await sendManagerReminder({ workflowDbId, manager, employeeName: name });
      log.info('Manager reminder sent', { manager });
    }
  });

  // Block until signal or 72h timeout
  const signalReceived = await condition(() => approvalReceived, '72h');

  if (!signalReceived) {
    await updateWorkflowStep({ workflowDbId, step: 'waitForManagerApproval', stepIndex: 1, status: 'FAILED', status_overall: 'FAILED' });
    return { success: false, reason: 'Approval timed out after 72 hours', employeeId };
  }

  if (!approvalPayload.approved) {
    await updateWorkflowStep({ workflowDbId, step: 'waitForManagerApproval', stepIndex: 1, status: 'REJECTED', status_overall: 'FAILED' });
    return { success: false, reason: `Rejected by ${approvalPayload.approvedBy}: ${approvalPayload.reason || 'No reason given'}`, employeeId };
  }

  await updateWorkflowStep({ workflowDbId, step: 'waitForManagerApproval', stepIndex: 1, status: 'COMPLETED' });

  // STEP 2: Send Manager Approval Confirmation Email (New professional template)
  await sendManagerApprovalConfirmation({
    employeeId,
    name,
    personalEmail,
    manager,
  });

  // Step 2: Create work email after manager approval
  await updateWorkflowStep({ workflowDbId, step: 'createEmailAccount', stepIndex: 2, status: 'RUNNING' });
  const emailResult = await createEmailAccount({ employeeId, workflowDbId, name, personalEmail, department });
  await sendWorkflowUpdateEmail({
    employeeId,
    name,
    personalEmail,
    stage: 'managerApproved',
    manager,
    corporateEmail: emailResult.corporateEmail,
    temporaryPassword: emailResult.temporaryPassword,
  });

  await updateWorkflowStep({
    workflowDbId,
    step: 'createEmailAccount',
    stepIndex: 2,
    status: 'COMPLETED',
    result: { ...emailResult, emailSent: true }
  });

  // STEP 2.5: Notify IT Team
  await sendITApprovalRequest({
    itEmail: 'harsha.ti.app@gmail.com', // Dedicated IT Admin
    employeeName: name,
    employeeId: initResult.employeeId,
    role,
    department,
    laptop,
  });

  // Step 3: IT approval for laptop provisioning (human-in-the-loop via signal)
  await updateWorkflowStep({ workflowDbId, step: 'waitForITApproval', stepIndex: 3, status: 'WAITING_SIGNAL' });

  let itApprovalReceived = false;
  let itApprovalPayload = { approved: false, approvedBy: null, reason: null };

  setHandler(itApprovalSignal, (payload) => {
    itApprovalPayload = payload;
    itApprovalReceived = true;
    log.info('IT approval signal received', { approved: payload.approved, by: payload.approvedBy });
  });

  // Block until signal or 72h timeout
  const itSignalReceived = await condition(() => itApprovalReceived, '72h');

  if (!itSignalReceived) {
    await updateWorkflowStep({ workflowDbId, step: 'waitForITApproval', stepIndex: 3, status: 'FAILED', status_overall: 'FAILED' });
    return { success: false, reason: 'IT approval timed out after 72 hours', employeeId };
  }

  if (!itApprovalPayload.approved) {
    await updateWorkflowStep({ workflowDbId, step: 'waitForITApproval', stepIndex: 3, status: 'REJECTED', status_overall: 'FAILED' });
    return { success: false, reason: `Rejected by IT (${itApprovalPayload.approvedBy}): ${itApprovalPayload.reason || 'No reason given'}`, employeeId };
  }

  await updateWorkflowStep({ workflowDbId, step: 'waitForITApproval', stepIndex: 3, status: 'COMPLETED' });
  await sendWorkflowUpdateEmail({
    employeeId,
    name,
    personalEmail,
    stage: 'itApproved',
    manager,
    corporateEmail: emailResult.corporateEmail,
    temporaryPassword: emailResult.temporaryPassword,
  });

  // Step 4: Provision laptop
  await updateWorkflowStep({ workflowDbId, step: 'provisionLaptop', stepIndex: 4, status: 'RUNNING' });
  const laptopResult = await provisionLaptop({ employeeId, workflowDbId, name, laptop, office });
  await updateWorkflowStep({ workflowDbId, step: 'provisionLaptop', stepIndex: 4, status: 'COMPLETED', result: laptopResult });

  // STEP 4.5: Notify HR Team
  await sendHRApprovalRequest({
    hrEmail: 'harsha.hr.ti@gmail.com', // Dedicated HR Admin
    employeeName: name,
    employeeId: initResult.employeeId,
    role,
    department,
    corporateEmail: emailResult.corporateEmail,
  });

  // Step 5: HR approval before access and payroll
  await updateWorkflowStep({ workflowDbId, step: 'waitForHRApproval', stepIndex: 5, status: 'WAITING_SIGNAL' });

  let hrApprovalReceived = false;
  let hrApprovalPayload = { approved: false, approvedBy: null, reason: null };

  setHandler(hrApprovalSignal, (payload) => {
    hrApprovalPayload = payload;
    hrApprovalReceived = true;
    log.info('HR approval signal received', { approved: payload.approved, by: payload.approvedBy });
  });

  const hrSignalReceived = await condition(() => hrApprovalReceived, '72h');

  if (!hrSignalReceived) {
    await updateWorkflowStep({ workflowDbId, step: 'waitForHRApproval', stepIndex: 5, status: 'FAILED', status_overall: 'FAILED' });
    return { success: false, reason: 'HR approval timed out after 72 hours', employeeId };
  }

  if (!hrApprovalPayload.approved) {
    await updateWorkflowStep({ workflowDbId, step: 'waitForHRApproval', stepIndex: 5, status: 'REJECTED', status_overall: 'FAILED' });
    return { success: false, reason: `Rejected by HR (${hrApprovalPayload.approvedBy}): ${hrApprovalPayload.reason || 'No reason given'}`, employeeId };
  }

  await updateWorkflowStep({ workflowDbId, step: 'waitForHRApproval', stepIndex: 5, status: 'COMPLETED' });

  // Step 6: Access rights
  await updateWorkflowStep({ workflowDbId, step: 'createAccessRights', stepIndex: 6, status: 'RUNNING' });
  const accessResult = await createAccessRights({ employeeId, workflowDbId, name, department, role });
  await updateWorkflowStep({ workflowDbId, step: 'createAccessRights', stepIndex: 6, status: 'COMPLETED', result: accessResult });

  // STEP 6.5: Send Access Rights email with MS Teams link + Portal link
  await sendWorkflowUpdateEmail({
    employeeId,
    name,
    personalEmail,
    stage: 'accessRightsReady',
    manager,
    corporateEmail: emailResult.corporateEmail,
    temporaryPassword: emailResult.temporaryPassword,
  });

  // Step 7: Payroll
  await updateWorkflowStep({ workflowDbId, step: 'notifyPayroll', stepIndex: 7, status: 'RUNNING' });
  const payrollResult = await notifyPayroll({ employeeId, workflowDbId, name, department, role });
  await updateWorkflowStep({ workflowDbId, step: 'notifyPayroll', stepIndex: 7, status: 'COMPLETED', result: payrollResult });

  // Step 8: Welcome email — marks workflow COMPLETED
  await updateWorkflowStep({ workflowDbId, step: 'sendWelcomeEmail', stepIndex: 8, status: 'RUNNING' });
  await sendWelcomeEmail({
    employeeId,
    workflowDbId,
    name,
    personalEmail,
    manager,
    department,
    role,
    corporateEmail: emailResult.corporateEmail,
    temporaryPassword: emailResult.temporaryPassword,
  });
  await updateWorkflowStep({ workflowDbId, step: 'sendWelcomeEmail', stepIndex: 8, status: 'COMPLETED', status_overall: 'COMPLETED' });

  log.info('Workflow completed', { employeeId, name });

  return {
    success: true,
    employeeId,
    name,
    personalEmail,
    corporateEmail: emailResult.corporateEmail,
    temporaryPassword: emailResult.temporaryPassword,
    laptopTicket: laptopResult.ticketId,
    accessGroups: accessResult.groups,
    payrollRef: payrollResult.payrollRef,
    completedAt: new Date().toISOString(),
  };
}

module.exports = { employeeOnboardingWorkflow, managerApprovalSignal, itApprovalSignal, hrApprovalSignal };
