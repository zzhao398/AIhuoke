# TODO - Setup and Testing Checklist

## 🚀 Phase 1: POC Setup (Do This Now)

### Step 1: Get Your API Keys

#### Claude API Key
- [ ] Go to https://console.anthropic.com
- [ ] Create account or sign in
- [ ] Navigate to API Keys
- [ ] Create a new key
- [ ] Copy the key (starts with `sk-ant-`)

#### WhatsApp Business API Credentials
- [ ] Go to https://business.facebook.com
- [ ] Create or select your Business Manager account
- [ ] Go to WhatsApp → Getting Started
- [ ] Complete business verification if needed
- [ ] Navigate to **API Setup** section
- [ ] Copy your **Phone Number ID** (long number)
- [ ] Click **Generate Token** or copy existing **Access Token** (starts with `EAAG`)
- [ ] Create a **Verify Token** (any random string, e.g., `my_secret_webhook_token_2024`)

### Step 2: Configure Environment

- [ ] Open `.env` file in the project root
- [ ] Replace `sk-ant-xxx` with your actual Claude API key
- [ ] Replace `EAAGxxx` with your WhatsApp access token
- [ ] Replace `123456789` with your WhatsApp phone number ID
- [ ] Replace `your_random_token_here` with your verify token (create any random string)
- [ ] Save the file

Example `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
CLAUDE_MODEL=claude-sonnet-4-5-20250929

WA_TOKEN=EAAGxxxxxxxxxxxxxxxxxxxxxx
WA_PHONE_NUMBER_ID=123456789012345
WA_VERIFY_TOKEN=my_secret_webhook_token_2024
WA_API_VERSION=v21.0

PORT=3000
NODE_ENV=development
```

### Step 3: Start the Server

```bash
# In the project directory
npm run dev
```

Expected output:
```
=================================
WhatsApp Lead Qualifier - POC
=================================
Server listening on port 3000
Environment: development
...
```

- [ ] Server starts without errors
- [ ] You see "Server listening on port 3000"

### Step 4: Expose Your Server (ngrok)

#### Install ngrok (if not installed)
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Start ngrok
```bash
# In a NEW terminal window
ngrok http 3000
```

- [ ] ngrok starts successfully
- [ ] You see an HTTPS URL (e.g., `https://abc123.ngrok.io`)
- [ ] Copy the HTTPS URL (you'll need it next)

### Step 5: Configure WhatsApp Webhook

- [ ] Go to Meta Business Manager → WhatsApp
- [ ] Navigate to **Configuration** tab
- [ ] Scroll to **Webhook** section
- [ ] Click **Edit** button
- [ ] In **Callback URL**, enter: `https://YOUR-NGROK-URL.ngrok.io/webhook`
- [ ] In **Verify Token**, enter the same value as `WA_VERIFY_TOKEN` from your `.env`
- [ ] Click **Verify and Save**
- [ ] You should see a ✅ green checkmark
- [ ] Click **Manage** button
- [ ] Subscribe to **messages** webhook event
- [ ] Save changes

### Step 6: Test the Bot!

- [ ] Open WhatsApp on your phone
- [ ] Send a message to your WhatsApp Business number
- [ ] Try: "Hello, I'm interested in vehicles"
- [ ] Wait 2-5 seconds
- [ ] You should receive an intelligent response!

Example conversation:
```
You: Hello
Bot: Hi! I'd be happy to help you with vehicle export. Which country are you looking to ship to?

You: Dubai
Bot: Great! Dubai, UAE. How many vehicles are you looking to purchase? (e.g., 1-5, 6-20, or 20+)

You: 20 units
Bot: Excellent! 20+ vehicles to Dubai. May I have your company name?

You: ABC Motors
Bot: Thank you, ABC Motors. Are you a dealer, trader, fleet operator, or project buyer?
```

---

## ✅ Verification Tests

### Basic Functionality
- [ ] Server starts and runs without crashing
- [ ] Webhook verification succeeds (green checkmark)
- [ ] Receive response to "Hello" message
- [ ] Response is relevant and intelligent
- [ ] Bot asks about destination country

### Field Extraction
- [ ] Send "I need 10 cars to Saudi Arabia"
- [ ] Bot recognizes country (Saudi Arabia)
- [ ] Bot recognizes quantity bucket (6-20)
- [ ] Bot doesn't ask for information you already provided

### Context Memory
- [ ] Have a 4-5 message conversation
- [ ] Bot remembers previous answers
- [ ] Bot doesn't ask same question twice
- [ ] Conversation flows naturally

### Error Handling
- [ ] Send a very long message (500+ words)
- [ ] Bot still responds appropriately
- [ ] Send emojis: "😊 Hello"
- [ ] Bot handles gracefully

### Server Logs
- [ ] Check terminal where server is running
- [ ] You should see incoming messages logged
- [ ] You should see "✓ Claude response received"
- [ ] You should see "✓ Message sent to [phone_number]"
- [ ] Extracted fields are logged

---

## 🐛 Troubleshooting

### Problem: Webhook verification fails
**Check:**
- [ ] Is server running? (check terminal)
- [ ] Is ngrok running? (check ngrok terminal)
- [ ] Does ngrok URL work? (visit in browser, should see JSON)
- [ ] Does verify token match? (.env and Meta Business Manager)
- [ ] Did you include `/webhook` in the URL?

### Problem: No response from bot
**Check:**
- [ ] Server logs for errors
- [ ] Is ANTHROPIC_API_KEY valid?
- [ ] Go to console.anthropic.com → check API credits
- [ ] Is webhook subscribed to "messages" event?
- [ ] Check WhatsApp Business Manager for errors

### Problem: Bot response is generic/unhelpful
**Check:**
- [ ] Server logs for Claude response
- [ ] Are fields being extracted? (check logs)
- [ ] Is conversation history maintained?
- [ ] Try restarting the server

### Problem: "WhatsApp API error"
**Check:**
- [ ] Is WA_TOKEN valid and not expired?
- [ ] Is WA_PHONE_NUMBER_ID correct?
- [ ] Check Meta Business Manager for token status
- [ ] Try regenerating the access token

---

## 📊 Success Criteria (POC)

Mark these when achieved:

- [ ] ✅ Server runs stably for 10+ minutes
- [ ] ✅ Successfully receive and respond to 5+ messages
- [ ] ✅ Extract at least 2 fields correctly (country + quantity)
- [ ] ✅ Maintain context across 3+ message exchanges
- [ ] ✅ Response time consistently < 5 seconds
- [ ] ✅ Zero crashes or fatal errors

---

## 🎯 Phase 2: MVP (Do This After POC Works)

**Don't start Phase 2 until POC is fully validated!**

### Prerequisites
- [ ] POC tested thoroughly
- [ ] Field extraction accuracy > 70%
- [ ] Completed 10+ test conversations
- [ ] Identified any issues or improvements
- [ ] All success criteria above met

### Phase 2 Tasks
- [ ] Implement state machine (GREET → QUALIFY → PROOF)
- [ ] Add lead scoring engine
- [ ] Integrate n8n webhooks for routing
- [ ] Create comprehensive skill documentation
- [ ] Add structured logging
- [ ] Test full conversation flows
- [ ] Test scoring accuracy
- [ ] Test routing logic

---

## 📝 Notes and Observations

Use this space to track issues, ideas, or improvements:

### Issues Found
-

### Performance Notes
-

### Conversation Quality
-

### Ideas for Improvement
-

---

## 🎉 When POC is Working

Celebrate! 🎊 You now have:
- A working WhatsApp chatbot
- AI-powered conversation
- Automatic field extraction
- Context-aware responses

Next steps:
1. Test with real potential customers
2. Gather feedback on conversation quality
3. Measure field extraction accuracy
4. Plan Phase 2 MVP implementation

---

**Current Status**: Ready for setup and testing
**Last Updated**: February 5, 2026
