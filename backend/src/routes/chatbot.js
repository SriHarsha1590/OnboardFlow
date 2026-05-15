const express = require('express');
const OpenAI = require('openai');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Initialize OpenAI client — key stays server-side only
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are OnboardFlow AI — an intelligent, friendly, and professional HR assistant embedded inside an employee onboarding platform called "OnboardFlow".

Your role is to help HR teams, managers, IT admins, and new employees with anything related to the onboarding process. You should be knowledgeable, concise, and helpful.

Here is context about the OnboardFlow system:
- It is a 4-step employee onboarding workflow powered by Temporal (a workflow orchestration engine).
- The 4 approval steps are: Manager Approval → IT Approval → HR Approval → Onboarding Complete.
- After an employee is created, an automated email is sent to the manager requesting approval.
- Once the manager approves, the system generates a corporate work email and temporary password, which is emailed to the employee.
- IT then approves laptop provisioning.
- HR then approves access rights and payroll setup.
- Finally, a welcome email with full credentials is sent to the employee.

You can help with:
1. Explaining the onboarding workflow and its steps
2. HR policies, best practices, and compliance questions
3. Common onboarding questions (documents needed, first day tips, benefits, etc.)
4. Technical questions about the OnboardFlow platform
5. Troubleshooting workflow issues (stuck approvals, email delivery, etc.)
6. General HR queries (leave policies, attendance, payroll basics, etc.)

Rules:
- Be professional yet friendly. Use clear, structured responses.
- If you don't know something specific to the company, say so and suggest who to contact.
- Never reveal API keys, passwords, or internal system credentials.
- Keep responses concise — use bullet points and headers when helpful.
- If asked about something outside HR/onboarding, politely redirect.`;

// POST /api/chatbot/message
router.post('/message', authenticate, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ success: false, error: 'AI service is not configured' });
    }

    // Build conversation messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message.trim() },
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';

    res.json({
      success: true,
      data: {
        reply,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        usage: completion.usage,
      },
    });
  } catch (err) {
    console.error('Chatbot error:', err.message);

    if (err.status === 401 || err.code === 'invalid_api_key') {
      return res.status(503).json({ success: false, error: 'AI service authentication failed' });
    }
    if (err.status === 429) {
      return res.status(429).json({ success: false, error: 'Rate limit reached. Please wait a moment and try again.' });
    }

    res.status(500).json({ success: false, error: 'Failed to process your message. Please try again.' });
  }
});

module.exports = router;
