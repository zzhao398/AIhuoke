import express from 'express';
import bodyParser from 'body-parser';
import { config } from './config.js';
import { getResponse } from './claude.service.js';
import { sendMessage, markAsRead } from './whatsapp.service.js';

const app = express();
app.use(bodyParser.json());

// In-memory session storage
// Key: wa_id (WhatsApp user ID)
// Value: { messages: [], lead_data: {}, created_at, updated_at }
const sessions = new Map();

/**
 * Get or create a session for a user
 */
function getSession(waId) {
  if (!sessions.has(waId)) {
    sessions.set(waId, {
      wa_id: waId,
      messages: [],
      lead_data: {
        destination_country: '',
        destination_port: '',
        qty_bucket: '',
        company_name: '',
        buyer_type: '',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log(`Created new session for ${waId}`);
  }
  return sessions.get(waId);
}

/**
 * Update session with new message and extracted fields
 */
function updateSession(waId, userMessage, assistantMessage, extractedFields) {
  const session = getSession(waId);

  // Add messages to history
  session.messages.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: assistantMessage }
  );

  // Keep only last 10 messages to control context size
  if (session.messages.length > 10) {
    session.messages = session.messages.slice(-10);
  }

  // Update lead_data with any newly extracted fields
  for (const [key, value] of Object.entries(extractedFields)) {
    if (value && value.trim() !== '') {
      session.lead_data[key] = value;
    }
  }

  session.updated_at = new Date().toISOString();

  console.log(`Session updated for ${waId}`);
  console.log(`  Lead data:`, session.lead_data);
}

/**
 * GET /webhook - Webhook verification endpoint
 * WhatsApp will call this to verify the webhook
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('Webhook verification request received');

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    console.log('✓ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('✗ Webhook verification failed');
    res.sendStatus(403);
  }
});

/**
 * POST /webhook - Receive incoming WhatsApp messages
 */
app.post('/webhook', async (req, res) => {
  try {
    // Quickly acknowledge receipt to WhatsApp
    res.sendStatus(200);

    const body = req.body;

    // Check if this is a message notification
    if (!body.entry || !body.entry[0].changes || !body.entry[0].changes[0].value.messages) {
      console.log('Not a message notification, ignoring');
      return;
    }

    const change = body.entry[0].changes[0].value;
    const message = change.messages[0];

    // Extract message details
    const waId = message.from;
    const messageId = message.id;
    const messageType = message.type;

    console.log(`\n--- Incoming message from ${waId} ---`);

    // Only handle text messages for now
    if (messageType !== 'text') {
      console.log(`Unsupported message type: ${messageType}`);
      await sendMessage(waId, "I can only process text messages at the moment. Please send your message as text.");
      return;
    }

    const userMessage = message.text.body;
    console.log(`User: ${userMessage}`);

    // Mark message as read
    await markAsRead(messageId);

    // Get or create session
    const session = getSession(waId);

    // Call Claude API
    const claudeResponse = await getResponse(session.messages, userMessage);

    // Extract fields and next message
    const { extracted_fields, next_message } = claudeResponse;

    // Update session
    updateSession(waId, userMessage, next_message, extracted_fields);

    // Send response to user
    await sendMessage(waId, next_message);
    console.log(`Assistant: ${next_message}`);
    console.log('---\n');

  } catch (error) {
    console.error('Error handling webhook:', error);
  }
});

/**
 * GET /health - Health check endpoint
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size,
  });
});

/**
 * GET / - Root endpoint
 */
app.get('/', (_req, res) => {
  res.json({
    service: 'WhatsApp Lead Qualifier',
    status: 'running',
    version: '0.1.0',
  });
});

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log('=================================');
  console.log('WhatsApp Lead Qualifier - POC');
  console.log('=================================');
  console.log(`Server listening on port ${PORT}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
  console.log(`\nWebhook URL: http://localhost:${PORT}/webhook`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('\nWaiting for WhatsApp messages...\n');
});
