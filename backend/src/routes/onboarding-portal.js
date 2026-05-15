/**
 * Onboarding Portal Routes
 * Handles access rights info, insurance form, banking details
 */
const express = require('express');
const pool = require('../db/pool');
const { sendWorkflowEmail, sendFinalWelcomeEmail } = require('../utils/mailer');

const router = express.Router();

// GET /api/onboarding-portal/:employeeId - Get employee onboarding portal data
router.get('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId);
    const whereClause = isUuid ? 'e.id = $1' : 'e.employee_id = $1';

    const { rows: empRows } = await pool.query(
      `SELECT e.*, w.workflow_id, w.status as workflow_status, w.current_step, w.current_step_index
       FROM employees e LEFT JOIN workflows w ON w.employee_id = e.id
       WHERE ${whereClause}`,
      [employeeId]
    );

    if (!empRows[0]) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const emp = empRows[0];
    const internalId = emp.id; // Always the UUID

    // Get insurance dependents using internal UUID
    const { rows: dependents } = await pool.query(
      'SELECT * FROM insurance_dependents WHERE employee_id = $1 ORDER BY sno',
      [internalId]
    );

    // Get banking details using internal UUID
    const { rows: banking } = await pool.query(
      'SELECT * FROM banking_details WHERE employee_id = $1',
      [internalId]
    );

    res.json({
      success: true,
      data: {
        employee: emp,
        dependents,
        bankingDetails: banking[0] || null,
        insuranceSubmitted: emp.insurance_submitted || false,
        bankingSubmitted: emp.banking_submitted || false,
        personalNumber: banking[0]?.personal_number || null,
      },
    });
  } catch (err) {
    console.error('GET /onboarding-portal error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/onboarding-portal/:employeeId/insurance - Submit insurance dependents
router.post('/:employeeId/insurance', async (req, res) => {
  const client = await pool.connect();
  try {
    const { employeeId } = req.params;
    const { dependents } = req.body;

    if (!dependents || !Array.isArray(dependents) || dependents.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one dependent is required' });
    }

    await client.query('BEGIN');

    // Clear existing dependents
    await client.query('DELETE FROM insurance_dependents WHERE employee_id = $1', [employeeId]);

    // Insert new dependents
    for (const dep of dependents) {
      await client.query(
        `INSERT INTO insurance_dependents (employee_id, sno, dep_employee_id, name, age, dob, relationship, gender)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [employeeId, dep.sno, dep.employeeId || null, dep.name, dep.age, dep.dob, dep.relationship, dep.gender]
      );
    }

    // Mark insurance as submitted
    await client.query('UPDATE employees SET insurance_submitted = TRUE WHERE id = $1', [employeeId]);

    // Log it
    await client.query(
      `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, 'INSURANCE_DEPENDENTS_SUBMITTED', 'employee', $2)`,
      [employeeId, JSON.stringify({ count: dependents.length, dependents: dependents.map(d => d.name) })]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `${dependents.length} dependents submitted for insurance`,
    });

    // Check if banking is also submitted to send the final welcome email
    const { rows: empRowsFinal } = await pool.query('SELECT name, email, banking_submitted FROM employees WHERE id = $1', [employeeId]);
    if (empRowsFinal[0] && empRowsFinal[0].banking_submitted) {
      sendFinalWelcomeEmail({
        to: empRowsFinal[0].email,
        employeeName: empRowsFinal[0].name,
      }).catch(err => console.error('Failed to send final welcome email after insurance:', err.message));
      return; // Skip the individual request email if everything is done
    }

    // Send banking request email from HR to the employee (async, don't block response)
    const { rows: empRows2 } = await pool.query('SELECT name, email FROM employees WHERE id = $1', [employeeId]);
    if (empRows2[0]) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      sendWorkflowEmail({
        to: empRows2[0].email,
        subject: `${empRows2[0].name}, Please Submit Your Banking Details`,
        html: `
          <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 28px; text-align: center;">
              <h2 style="color: #fff; margin: 0;">Banking Details Required</h2>
            </div>
            <div style="padding: 28px; background: #fff;">
              <p>Hello <strong>${empRows2[0].name}</strong>,</p>
              <p>Thank you for submitting your insurance dependents. As the final step, please submit your banking details for salary processing.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${frontendUrl}/onboarding-portal/${employeeId}" style="background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">Submit Banking Details</a>
              </div>
              <p style="color: #64748b; font-size: 13px;">Best Regards,<br>HR Team — OnboardFlow</p>
            </div>
          </div>
        `,
        type: 'HR',
      }).catch(err => console.error('Failed to send banking request email:', err.message));
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('POST /insurance error:', err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/onboarding-portal/:employeeId/banking - Submit banking details
router.post('/:employeeId/banking', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId);
    let internalId = employeeId;

    if (!isUuid) {
      const { rows } = await pool.query('SELECT id FROM employees WHERE employee_id = $1', [employeeId]);
      if (!rows[0]) return res.status(404).json({ success: false, error: 'Employee not found' });
      internalId = rows[0].id;
    }

    const { 
      accountHolderName, bankName, accountNumber, ifscCode, branch, panNumber,
      uanNumber, aadharNumber, alternateContact, permanentAddress, personalNumber
    } = req.body;

    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({ success: false, error: 'Required fields: accountHolderName, bankName, accountNumber, ifscCode' });
    }

    // Upsert banking details
    await pool.query('DELETE FROM banking_details WHERE employee_id = $1', [internalId]);
    await pool.query(
      `INSERT INTO banking_details (
        employee_id, account_holder_name, bank_name, account_number, ifsc_code, branch, pan_number,
        uan_number, aadhar_number, alternate_contact, permanent_address, personal_number
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        internalId, accountHolderName, bankName, accountNumber, ifscCode, branch || null, panNumber || null,
        uanNumber || null, aadharNumber || null, alternateContact || null, permanentAddress || null, personalNumber || null
      ]
    );

    // Mark banking as submitted
    await pool.query('UPDATE employees SET banking_submitted = TRUE WHERE id = $1', [internalId]);

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (employee_id, action, actor, details) VALUES ($1, 'BANKING_DETAILS_SUBMITTED', 'employee', $2)`,
      [internalId, JSON.stringify({ bankName, ifscCode, branch })]
    );

    res.json({
      success: true,
      message: 'Banking details submitted successfully',
    });

    // Send confirmation email from HR (async)
    const { rows: empRows3 } = await pool.query('SELECT name, email, insurance_submitted FROM employees WHERE id = $1', [employeeId]);
    if (empRows3[0]) {
      // If both are submitted, send the ENHANCED welcome email
      if (empRows3[0].insurance_submitted) {
        sendFinalWelcomeEmail({
          to: empRows3[0].email,
          employeeName: empRows3[0].name,
        }).catch(err => console.error('Failed to send final welcome email after banking:', err.message));
      } else {
        // If only banking is submitted, send a simple confirmation
        sendWorkflowEmail({
          to: empRows3[0].email,
          subject: `Banking Details Received — Welcome, ${empRows3[0].name}!`,
          html: `
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 28px; text-align: center;">
                <h2 style="color: #fff; margin: 0;">✅ Banking Details Received</h2>
              </div>
              <div style="padding: 28px; background: #fff;">
                <p>Hello <strong>${empRows3[0].name}</strong>,</p>
                <p>Your banking details have been received successfully. Please ensure you have also submitted your <strong>Insurance Dependent Details</strong> to complete your onboarding.</p>
                <p style="color: #64748b; font-size: 13px;">Best Regards,<br>HR Team — OnboardFlow</p>
              </div>
            </div>
          `,
          type: 'HR',
        }).catch(err => console.error('Failed to send banking confirmation email:', err.message));
      }
    }
  } catch (err) {
    console.error('POST /banking error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/onboarding-portal/:employeeId/bgv - Get BGV reference data
router.get('/:employeeId/bgv', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId);
    const whereClause = isUuid ? 'id = $1' : 'employee_id = $1';

    const { rows } = await pool.query(`SELECT bgv_data FROM employees WHERE ${whereClause}`, [employeeId]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Not found' });

    res.json({ success: true, data: rows[0].bgv_data || null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
