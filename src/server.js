import express from 'express';
import bodyParser from 'body-parser';
import { config } from './config.js';
import { getResponse } from './claude.service.js';
import { sendMessage, markAsRead } from './whatsapp.service.js';
import { transcribeWhatsAppAudio } from './whisper.service.js';
import { shouldAdvanceStage, getStageGuidance, isStageComplete } from './state-machine.js';
import { getScoreBreakdown, determineRoute } from './lead-scorer.js';
import { executeRouting } from './routing.service.js';

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
      stage: 'GREET',
      stage_turn_count: 0,
      score: 0,
      score_history: [],
      risk_flags: [],
      lead_data: {
        destination_country: '',
        destination_port: '',
        qty_bucket: '',
        company_name: '',
        buyer_type: '',
        contact_method: '',
        timeline: '',
        budget_indication: '',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log(`Created new session for ${waId}`);
  }
  return sessions.get(waId);
}

/**
 * Update session with new message and Claude response
 */
function updateSession(waId, userMessage, claudeResponse) {
  const session = getSession(waId);

  // Add messages to history
  session.messages.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: claudeResponse.next_message }
  );

  // Keep only last 10 messages to control context size
  if (session.messages.length > 10) {
    session.messages = session.messages.slice(-10);
  }

  // Increment turn count for current stage
  session.stage_turn_count = (session.stage_turn_count || 0) + 1;

  // Log Claude's stage suggestion (informational only - state machine controls actual stage)
  if (claudeResponse.stage && claudeResponse.stage !== session.stage) {
    console.log(`ℹ️  Claude suggested stage: ${claudeResponse.stage} (current: ${session.stage})`);
  }

  // Update score
  if (claudeResponse.score_delta !== undefined) {
    session.score += claudeResponse.score_delta;
    session.score_history.push({
      delta: claudeResponse.score_delta,
      reasons: claudeResponse.reasons || [],
      timestamp: new Date().toISOString(),
    });
  }

  // Update risk flags
  if (claudeResponse.risk_flags && claudeResponse.risk_flags.length > 0) {
    session.risk_flags = [...new Set([...session.risk_flags, ...claudeResponse.risk_flags])];
  }

  // Update lead_data with any newly extracted fields
  for (const [key, value] of Object.entries(claudeResponse.extracted_fields || {})) {
    if (value && typeof value === 'string' && value.trim() !== '') {
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

    // Handle text and audio (voice) messages
    let userMessage;

    if (messageType === 'text') {
      userMessage = message.text.body;
    } else if (messageType === 'audio') {
      const mediaId = message.audio.id;
      console.log(`Voice message received, transcribing: ${mediaId}`);
      try {
        userMessage = await transcribeWhatsAppAudio(mediaId);
        if (!userMessage) {
          await sendMessage(waId, "Sorry, I couldn't understand the voice message. Could you please type your message?");
          return;
        }
      } catch (err) {
        console.error('Transcription error:', err);
        await sendMessage(waId, "Sorry, I had trouble processing the voice message. Could you please type your message?");
        return;
      }
    } else {
      console.log(`Unsupported message type: ${messageType}`);
      await sendMessage(waId, "I can only process text and voice messages.");
      return;
    }
    console.log(`User: ${userMessage}`);

    // Mark message as read
    await markAsRead(messageId);

    // Get or create session
    const session = getSession(waId);

    // Get stage guidance for Claude
    const stageInfo = getStageGuidance(session.stage, session.lead_data);

    // Call Claude API with stage context
    const claudeResponse = await getResponse(session.messages, userMessage, stageInfo, session.score);

    // Update session with Claude's response
    updateSession(waId, userMessage, claudeResponse);

    // Check if stage should advance
    const advancement = shouldAdvanceStage(session);
    if (advancement.shouldAdvance && advancement.nextStage) {
      console.log(`📈 Stage advancing: ${session.stage} → ${advancement.nextStage} (${advancement.reason})`);
      session.stage = advancement.nextStage;
      session.stage_turn_count = 0; // Reset turn counter for new stage
    }

    // Log scoring and stage info
    console.log(`Stage: ${session.stage}, Score Δ: ${claudeResponse.score_delta}, Total: ${session.score}`);
    if (claudeResponse.reasons && claudeResponse.reasons.length > 0) {
      console.log(`Reasons: ${claudeResponse.reasons.join(', ')}`);
    }
    if (claudeResponse.risk_flags && claudeResponse.risk_flags.length > 0) {
      console.log(`⚠️  Risk Flags: ${claudeResponse.risk_flags.join(', ')}`);
    }

    // Show score breakdown
    const breakdown = getScoreBreakdown(session.lead_data, session.risk_flags);
    console.log(`Score Breakdown: Identity=${breakdown.breakdown.identity_trust}, Transaction=${breakdown.breakdown.transaction_intent}, Clarity=${breakdown.breakdown.requirement_clarity}, Risk=${breakdown.breakdown.risk_deductions}`);

    console.log(`Route: ${claudeResponse.route}`);

    // Send response to user first
    await sendMessage(waId, claudeResponse.next_message);
    console.log(`Assistant: ${claudeResponse.next_message}`);

    // Handle routing (async, don't block user response)
    if (claudeResponse.route !== 'CONTINUE') {
      console.log(`\n🎯 Executing routing: ${claudeResponse.route}`);
      const routingResult = await executeRouting(claudeResponse.route, session, claudeResponse.handoff_summary);

      if (routingResult.success) {
        console.log(`✅ Routing completed successfully`);
      } else {
        console.log(`⚠️  Routing failed: ${routingResult.reason || 'unknown'}`);
      }
    }
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
