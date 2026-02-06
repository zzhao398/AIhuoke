# Quick Start Guide

## Phase 1: POC is Ready! 🎉

You now have a working WhatsApp chatbot POC. Follow these steps to test it.

## Setup Steps

### 1. Configure Your API Keys

Edit the `.env` file with your actual credentials:

```bash
# Get these values:
# - ANTHROPIC_API_KEY: From console.anthropic.com
# - WA_TOKEN: From Meta Business Manager → WhatsApp → API Setup
# - WA_PHONE_NUMBER_ID: From Meta Business Manager → WhatsApp → API Setup
# - WA_VERIFY_TOKEN: Create a random string (e.g., "my_secret_token_12345")
```

### 2. Start the Server

```bash
npm run dev
```

You should see:
```
=================================
WhatsApp Lead Qualifier - POC
=================================
Server listening on port 3000
Environment: development

Webhook URL: http://localhost:3000/webhook
Health check: http://localhost:3000/health

Waiting for WhatsApp messages...
```

### 3. Expose Your Local Server (for Testing)

In a new terminal:

```bash
# Install ngrok if you haven't
# brew install ngrok  # macOS
# or download from https://ngrok.com/

# Start ngrok tunnel
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 4. Configure WhatsApp Webhook

1. Go to **Meta Business Manager** (business.facebook.com)
2. Navigate to **WhatsApp → Configuration**
3. Find the **Webhook** section
4. Click **Edit**
5. Enter:
   - **Callback URL**: `https://your-ngrok-url.ngrok.io/webhook`
   - **Verify Token**: Same value as `WA_VERIFY_TOKEN` in your `.env` file
6. Click **Verify and Save**
7. Subscribe to **messages** webhook events

### 5. Test the Chatbot

Send a message from your phone to your WhatsApp Business number:

```
Hello, I'm interested in vehicles
```

You should receive an intelligent response asking about destination country or quantity!

## Verification Checklist

- [ ] Server starts successfully on port 3000
- [ ] Webhook verification passes (green checkmark in Meta Business Manager)
- [ ] Send "Hello" → Receive intelligent response
- [ ] Send "I need 10 cars to Dubai" → Bot extracts quantity and country
- [ ] Have 3-4 message conversation → Bot remembers context

## Testing Scenarios

### Test 1: Basic Greeting
```
You: Hello
Bot: Hi! I'd be happy to help you with vehicle export. Which country are you looking to ship to?
```

### Test 2: Information Extraction
```
You: We need 15 vehicles for our company in Saudi Arabia
Bot: Great! I see you're looking to ship 15 vehicles to Saudi Arabia. May I have your company name?
```

### Test 3: Multi-turn Conversation
```
You: Hi, interested in BYD vehicles
Bot: Great! Which country or port are you shipping to?
You: Dubai
Bot: Perfect, Dubai. How many vehicles are you looking to purchase? (e.g., 1-5, 6-20, or 20+)
You: Around 20 units
Bot: Excellent! For 20+ vehicles to Dubai. May I have your company name?
You: ABC Trading
Bot: Thank you, ABC Trading. Are you a dealer, trader, fleet operator, or project buyer?
```

## Troubleshooting

### Issue: Webhook verification fails
**Solution**:
- Ensure `WA_VERIFY_TOKEN` in `.env` matches exactly what you entered in Meta Business Manager
- Check that ngrok URL is correct and accessible
- Make sure server is running

### Issue: No response from bot
**Solution**:
- Check server logs for errors
- Verify `ANTHROPIC_API_KEY` is valid
- Check Claude API credits at console.anthropic.com
- Ensure WhatsApp webhook is subscribed to "messages" events

### Issue: WhatsApp message not sent
**Solution**:
- Verify `WA_TOKEN` is valid and not expired
- Check `WA_PHONE_NUMBER_ID` is correct
- Look at server logs for WhatsApp API errors

### Issue: "Invalid JSON" errors
**Solution**:
- This is a Claude API response parsing issue
- Check server logs for the raw response
- Verify the JSON schema in `claude.service.js` is correct

## Monitoring Your Bot

### Health Check
```bash
curl http://localhost:3000/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-02-05T...",
  "activeSessions": 1
}
```

### Session Data
Currently stored in memory. To view sessions:
- Check server logs when messages are received
- Each message logs extracted fields and lead data

## Next Steps

Once the POC is working:

1. **Test thoroughly**: Have multiple conversations
2. **Verify field extraction**: Check that country, quantity, company name are extracted correctly
3. **Test edge cases**: Long messages, emojis, typos
4. **Ready for MVP**: Once stable, proceed to Phase 2 (state machine, scoring, routing)

## Cost Monitoring

Each message costs approximately:
- Claude API: ~$0.015 per message (Sonnet 4.5)
- WhatsApp: Free for first 1,000 conversations/month
- Budget for POC: ~$5 for 300 test messages

## Support

If you encounter issues:
1. Check the main `README.md` for detailed troubleshooting
2. Review `project_design.md` for architecture details
3. Check server logs for error messages
4. Verify all environment variables are set correctly

---

**Status**: Phase 1 (POC) Complete ✅
**Files**: 9 core files created
**Features**: Basic conversation, field extraction, context memory
**Ready for**: Testing and validation
