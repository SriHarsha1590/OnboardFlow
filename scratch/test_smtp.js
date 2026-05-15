const nodemailer = require('nodemailer');
require('dotenv').config({ path: './backend/.env' });

async function test() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    console.log('Testing SMTP with:', process.env.SMTP_USER);
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: 'sriharshanandiraju@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email from OnboardFlow.',
    });
    console.log('✅ Success! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

test();
