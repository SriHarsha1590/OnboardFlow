const nodemailer = require('nodemailer');
require('dotenv').config({ path: './backend/.env' });

async function test() {
  const transporter = nodemailer.createTransport({
    host: process.env.MANAGER_SMTP_HOST,
    port: parseInt(process.env.MANAGER_SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.MANAGER_SMTP_USER,
      pass: process.env.MANAGER_SMTP_PASSWORD,
    },
  });

  try {
    console.log('Testing SMTP with:', process.env.MANAGER_SMTP_USER);
    const info = await transporter.sendMail({
      from: process.env.MANAGER_SMTP_FROM,
      to: 'sriharshanandiraju@gmail.com',
      subject: 'Test Email (Manager)',
      text: 'This is a test email from OnboardFlow using Manager SMTP.',
    });
    console.log('✅ Success! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

test();
