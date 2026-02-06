# WhatsApp B2B Lead Qualifier

A WhatsApp chatbot powered by Claude AI that qualifies B2B vehicle export leads through intelligent conversation.

## Features

- Receives WhatsApp messages via webhook
- Uses Claude AI for intelligent conversation
- Extracts structured lead information
- Maintains conversation context
- Routes qualified leads to sales team

## Prerequisites

1. **WhatsApp Business Account**
   - WhatsApp Business API access
   - Phone Number ID and Access Token
   - Verification token

2. **Claude API Key**
   - Get from console.anthropic.com

3. **Server with HTTPS**
   - Local dev: ngrok tunnel
   - Production: VPS with SSL cert

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- `ANTHROPIC_API_KEY`: Your Claude API key
- `WA_TOKEN`: WhatsApp access token
- `WA_PHONE_NUMBER_ID`: Your WhatsApp phone number ID
- `WA_VERIFY_TOKEN`: Random string for webhook verification

### 3. Run Locally

```bash
# Start the server
npm run dev

# In another terminal, start ngrok
ngrok http 3000
```

### 4. Configure WhatsApp Webhook

1. Go to Meta Business Manager → WhatsApp → Configuration
2. Enter webhook URL: `https://your-ngrok-url.ngrok.io/webhook`
3. Enter verify token (same as in .env)
4. Subscribe to messages webhook

## Testing

Send a WhatsApp message to your business number. The bot should respond with an intelligent question about your vehicle export needs.

## Project Structure

```
lead_engine/
├── .env                    # Environment variables (not in git)
├── .env.example            # Environment template
├── package.json            # Dependencies
├── README.md               # This file
├── project_design.md       # Design document
└── src/
    ├── server.js           # Main Express app with webhook
    ├── config.js           # Environment configuration
    ├── claude.service.js   # Claude API integration
    └── whatsapp.service.js # WhatsApp API calls
```

## API Endpoints

- `GET /webhook` - WhatsApp webhook verification
- `POST /webhook` - Receive incoming WhatsApp messages
- `GET /health` - Health check endpoint

## Architecture

1. WhatsApp sends message to webhook
2. Server extracts sender ID and message text
3. Server calls Claude API with conversation history
4. Claude returns structured response with extracted fields
5. Server updates session data
6. Server sends response back via WhatsApp API

## Development

```bash
# Run with hot reload
npm run dev

# Run in production mode
npm start
```

## Troubleshooting

### Webhook verification fails
- Check that `WA_VERIFY_TOKEN` in .env matches Meta Business Manager
- Ensure ngrok URL is accessible

### Messages not received
- Check WhatsApp webhook subscription is active
- Verify phone number has permission to send messages

### Claude API errors
- Verify `ANTHROPIC_API_KEY` is valid
- Check API credits at console.anthropic.com

### No response sent to WhatsApp
- Check `WA_TOKEN` is valid and not expired
- Verify `WA_PHONE_NUMBER_ID` is correct
- Check server logs for API errors

## License

MIT
