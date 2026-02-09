import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

const SYSTEM_PROMPT = `You are a B2B lead qualification assistant for a vehicle export company specializing in BYD and other vehicles to the Middle East.

Your goal: Qualify potential buyers by asking concise questions and extracting key information.

Key fields to collect:
- destination_country: The country they want to ship to
- destination_port: Specific port or city (if mentioned)
- qty_bucket: Quantity range ("1-5", "6-20", or "20+")
- company_name: Their company or business name
- buyer_type: Type of buyer ("dealer", "trader", "fleet", or "project")

Rules:
1. Ask only ONE question per message
2. Be professional, friendly, and concise
3. Speak English only
4. Never request sensitive personal data (IDs, bank info, passwords)
5. Never promise final prices or make commitments
6. If user asks about specific models or prices, acknowledge and say details will be provided by sales team
7. Keep responses under 500 characters

Conversation flow:
1. Start by asking about destination country/port
2. Then ask about quantity needed
3. Then ask about their company name
4. Then identify buyer type if not already clear

Extract fields from user messages as they naturally provide information. Don't ask for information they've already given.

IMPORTANT: You must respond ONLY with valid JSON in this exact format:
{
  "extracted_fields": {
    "destination_country": "string or empty",
    "destination_port": "string or empty",
    "qty_bucket": "1-5 or 6-20 or 20+ or empty",
    "company_name": "string or empty",
    "buyer_type": "dealer or trader or fleet or project or empty"
  },
  "next_message": "your response to the user (max 500 characters)"
}`;

const JSON_SCHEMA = {
  type: 'object',
  required: ['extracted_fields', 'next_message'],
  additionalProperties: false,
  properties: {
    extracted_fields: {
      type: 'object',
      additionalProperties: false,
      properties: {
        destination_country: {
          type: 'string',
          description: 'Country name (e.g., "UAE", "Saudi Arabia", "Qatar")',
        },
        destination_port: {
          type: 'string',
          description: 'Port or city name (e.g., "Dubai", "Jebel Ali", "Riyadh")',
        },
        qty_bucket: {
          type: 'string',
          enum: ['1-5', '6-20', '20+'],
          description: 'Quantity range',
        },
        company_name: {
          type: 'string',
          description: 'Company or business name',
        },
        buyer_type: {
          type: 'string',
          enum: ['dealer', 'trader', 'fleet', 'project'],
          description: 'Type of buyer',
        },
      },
    },
    next_message: {
      type: 'string',
      description: 'The next question or response to send to the user',
    },
  },
};

/**
 * Get an intelligent response from Claude
 * @param {Array} conversationHistory - Array of {role, content} message objects
 * @param {string} userMessage - The latest user message
 * @returns {Promise<Object>} - Parsed JSON response with extracted_fields and next_message
 */
export async function getResponse(conversationHistory, userMessage) {
  try {
    // Build messages array with conversation history + new user message
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
      },
    ];

    console.log(`Calling Claude API with ${messages.length} messages...`);

    const response = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
      output_config: {
        format: {
          type: 'json_schema',
          schema: JSON_SCHEMA,
        },
      },
    });

    // Extract the JSON content
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const parsed = JSON.parse(content.text);
    console.log('✓ Claude response received');
    console.log('  Extracted fields:', Object.keys(parsed.extracted_fields).filter(k => parsed.extracted_fields[k]));

    return parsed;
  } catch (error) {
    console.error('Claude API error:', error);

    // Return fallback response
    return {
      extracted_fields: {},
      next_message: "I apologize, but I'm having technical difficulties. Could you please try again?",
    };
  }
}
