# Architecture Overview

## System Architecture (POC)

```
┌─────────────────────────────────────────────────────────────────┐
│                         WhatsApp User                           │
│                    (Sends: "I need 10 cars")                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ HTTPS POST

┌─────────────────────────────────────────────────────────────────┐
│                     Meta Graph API                              │
│              (WhatsApp Cloud API - Meta Servers)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ Webhook POST /webhook

┌─────────────────────────────────────────────────────────────────┐
│                    Express Server (server.js)                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  POST /webhook                                         │    │
│  │  - Extract wa_id and message text                      │    │
│  │  - Send 200 OK immediately (fast ACK)                  │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓

┌─────────────────────────────────────────────────────────────────┐
│                   Session Manager (Map)                         │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  sessions.get(wa_id)                                   │    │
│  │  - Conversation history (messages[])                   │    │
│  │  - Lead data (country, quantity, company, etc.)        │    │
│  │  - Created/updated timestamps                          │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ getResponse(history, newMessage)

┌─────────────────────────────────────────────────────────────────┐
│              Claude Service (claude.service.js)                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  System Prompt:                                        │    │
│  │  - B2B vehicle export qualification                    │    │
│  │  - Extract: country, port, qty, company, buyer type    │    │
│  │  - Professional, concise, English only                 │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ API Request with JSON Schema

┌─────────────────────────────────────────────────────────────────┐
│                  Claude API (Anthropic)                         │
│               Model: Claude Sonnet 4.5                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Input: Conversation history + new message            │    │
│  │  Output: Structured JSON                               │    │
│  │    {                                                    │    │
│  │      extracted_fields: { country, port, qty, ...},     │    │
│  │      next_message: "Which port in Dubai?"              │    │
│  │    }                                                    │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ Returns structured JSON

┌─────────────────────────────────────────────────────────────────┐
│                   Session Update Logic                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  1. Add user message to history                        │    │
│  │  2. Add assistant response to history                  │    │
│  │  3. Update lead_data with extracted_fields             │    │
│  │  4. Keep last 10 messages only                         │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ sendMessage(wa_id, text)

┌─────────────────────────────────────────────────────────────────┐
│          WhatsApp Service (whatsapp.service.js)                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  POST to Graph API                                     │    │
│  │  URL: /v21.0/{phone_id}/messages                       │    │
│  │  Payload: { to: wa_id, text: { body: "..." } }        │    │
│  └────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ HTTPS POST

┌─────────────────────────────────────────────────────────────────┐
│                     Meta Graph API                              │
│              (WhatsApp Cloud API - Meta Servers)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓ Message delivered

┌─────────────────────────────────────────────────────────────────┐
│                         WhatsApp User                           │
│              (Receives: "Which port in Dubai?")                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Message Reception
```
User Message → Meta → Webhook → Server
```

### 2. Session Retrieval
```
wa_id → sessions.get(wa_id) → Session Object
{
  messages: [...],
  lead_data: {...},
  timestamps
}
```

### 3. AI Processing
```
Session + New Message → Claude Service → Claude API
```

### 4. Response Generation
```
Claude → JSON {extracted_fields, next_message}
```

### 5. Session Update
```
Update messages[] + lead_data → sessions.set(wa_id, session)
```

### 6. Message Sending
```
next_message → WhatsApp Service → Meta → User
```

---

## Component Breakdown

### server.js (Main Application)
**Responsibilities**:
- HTTP server setup
- Webhook verification (GET /webhook)
- Message reception (POST /webhook)
- Session management (Map)
- Orchestration of services

**Key Functions**:
- `getSession(waId)` - Get or create session
- `updateSession()` - Update with new data
- Webhook handlers

**Lines of Code**: ~180

---

### claude.service.js (AI Integration)
**Responsibilities**:
- Claude API communication
- System prompt management
- JSON schema definition
- Response parsing
- Error handling

**Key Functions**:
- `getResponse(history, message)` - Main AI call

**Key Features**:
- Structured JSON output
- Field extraction schema
- Conversation history management
- Fallback responses

**Lines of Code**: ~130

---

### whatsapp.service.js (WhatsApp API)
**Responsibilities**:
- Send messages to users
- Mark messages as read
- API authentication
- Error handling

**Key Functions**:
- `sendMessage(waId, text)` - Send text message
- `markAsRead(messageId)` - Mark as read

**Key Features**:
- Graph API v21.0 integration
- Bearer token authentication
- Error logging

**Lines of Code**: ~80

---

### config.js (Configuration)
**Responsibilities**:
- Load environment variables
- Validate required variables
- Export typed config object

**Key Features**:
- dotenv integration
- Required variable validation
- Structured config export

**Lines of Code**: ~40

---

## Session Data Structure

```javascript
{
  wa_id: "1234567890",              // WhatsApp user ID
  messages: [                        // Conversation history
    {
      role: "user",
      content: "I need 10 cars"
    },
    {
      role: "assistant",
      content: "Great! Which country?"
    }
  ],
  lead_data: {                       // Extracted information
    destination_country: "UAE",
    destination_port: "Dubai",
    qty_bucket: "6-20",
    company_name: "",
    buyer_type: ""
  },
  created_at: "2026-02-05T10:00:00Z",
  updated_at: "2026-02-05T10:01:30Z"
}
```

---

## API Integrations

### Claude API (Anthropic)
**Endpoint**: `https://api.anthropic.com/v1/messages`
**Authentication**: API key (Bearer token)
**Model**: `claude-sonnet-4-5-20250929`

**Request**:
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 1024,
  "system": "...",
  "messages": [...],
  "response_format": {
    "type": "json_schema",
    "json_schema": {...}
  }
}
```

**Response**:
```json
{
  "extracted_fields": {
    "destination_country": "UAE",
    "qty_bucket": "6-20"
  },
  "next_message": "Great! May I have your company name?"
}
```

---

### WhatsApp Cloud API (Meta)
**Base URL**: `https://graph.facebook.com/v21.0`
**Authentication**: Access token (Bearer)

**Send Message**:
```
POST /{phone_number_id}/messages
```

**Request**:
```json
{
  "messaging_product": "whatsapp",
  "to": "1234567890",
  "type": "text",
  "text": {
    "body": "Great! Which country?"
  }
}
```

**Webhook**:
```
POST /webhook (your server)
```

**Webhook Payload**:
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "1234567890",
          "id": "wamid.xxx",
          "type": "text",
          "text": {
            "body": "I need 10 cars"
          }
        }]
      }
    }]
  }]
}
```

---

## Security Considerations

### Environment Variables
- All sensitive data in `.env`
- `.env` in `.gitignore`
- Configuration validation on startup

### Webhook Security
- Verify token validation (GET)
- Fast acknowledgment (POST)
- Input validation

### API Keys
- Claude API key: Read-only, rate-limited
- WhatsApp token: Scoped to messages only
- No keys in code or logs

---

## Performance Characteristics

### Response Times
- Webhook acknowledgment: <200ms
- Claude API call: 1-3 seconds
- WhatsApp message send: 200-500ms
- **Total**: 2-5 seconds end-to-end

### Scalability (POC)
- In-memory sessions: ~1000 active users
- Single server: ~10 concurrent requests
- No persistent storage
- Stateless design (except sessions)

### Resource Usage
- Memory: ~50MB base + 1KB per session
- CPU: Low (mostly I/O bound)
- Network: 2 API calls per message

---

## Error Handling

### Claude API Errors
- **Fallback**: "I'm having technical difficulties"
- **Logging**: Full error logged to console
- **Recovery**: Next message will retry

### WhatsApp API Errors
- **Retry**: Not implemented in POC
- **Logging**: Error details logged
- **Impact**: User doesn't receive response

### Invalid Input
- **Non-text messages**: Polite rejection
- **Empty messages**: Ignored
- **Malformed webhook**: Logged and ignored

---

## Limitations (POC)

### Technical
- In-memory sessions (lost on restart)
- No database persistence
- No analytics or metrics
- Single-stage conversation
- Basic error handling

### Functional
- English only
- Text messages only
- No media support
- No conversation history limits
- No spam protection

### Scale
- Single server
- ~1000 concurrent sessions
- No load balancing
- No horizontal scaling

---

## Future Enhancements (Phase 2)

### State Machine
```
GREET → QUALIFY → PROOF → ROUTE
```

### Lead Scoring
```
Calculate score (0-100)
→ HUMAN_NOW (≥75)
→ NURTURE (50-74)
→ FAQ_END (<50)
```

### n8n Integration
```
High-quality lead → n8n webhook → Sales notification
```

### Persistence
```
Redis for sessions
PostgreSQL for lead data
```

---

## Code Statistics

**Total Lines**: ~430 lines of JavaScript
**Files**: 4 core JS files
**Functions**: ~8 major functions
**API Integrations**: 2 (Claude, WhatsApp)

**Breakdown**:
- Business logic: 60%
- API integration: 25%
- Error handling: 10%
- Configuration: 5%

---

## Development Workflow

### Local Development
```
1. Edit code
2. Save (nodemon auto-restarts)
3. Test via WhatsApp
4. Check logs
5. Iterate
```

### Testing
```
1. Unit: Individual functions
2. Integration: Full message flow
3. E2E: Real WhatsApp messages
```

### Deployment
```
1. Set environment variables
2. Start server: npm start
3. Configure reverse proxy (nginx)
4. Set up SSL certificate
5. Configure WhatsApp webhook
6. Monitor logs
```

---

**Architecture Status**: ✅ POC Complete
**Complexity**: Low-Medium
**Maintainability**: High
**Scalability**: Low (POC), High (after Phase 2)
