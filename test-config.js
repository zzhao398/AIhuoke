#!/usr/bin/env node

/**
 * Configuration Test Script
 * Run this to verify your environment is set up correctly
 *
 * Usage: node test-config.js
 */

import { config } from './src/config.js';

console.log('\n=================================');
console.log('Configuration Test');
console.log('=================================\n');

const tests = [];

// Test 1: Claude API Key
if (config.anthropic.apiKey && config.anthropic.apiKey.startsWith('sk-ant-')) {
  tests.push({ name: 'Claude API Key', status: '✅', message: 'Format looks correct' });
} else if (config.anthropic.apiKey === 'sk-ant-xxx') {
  tests.push({ name: 'Claude API Key', status: '⚠️', message: 'Still using placeholder value' });
} else {
  tests.push({ name: 'Claude API Key', status: '❌', message: 'Invalid format' });
}

// Test 2: Claude Model
if (config.anthropic.model) {
  tests.push({ name: 'Claude Model', status: '✅', message: config.anthropic.model });
} else {
  tests.push({ name: 'Claude Model', status: '❌', message: 'Not configured' });
}

// Test 3: WhatsApp Token
if (config.whatsapp.token && config.whatsapp.token.startsWith('EAAG')) {
  tests.push({ name: 'WhatsApp Token', status: '✅', message: 'Format looks correct' });
} else if (config.whatsapp.token === 'EAAGxxx') {
  tests.push({ name: 'WhatsApp Token', status: '⚠️', message: 'Still using placeholder value' });
} else {
  tests.push({ name: 'WhatsApp Token', status: '❌', message: 'Invalid format' });
}

// Test 4: WhatsApp Phone Number ID
if (config.whatsapp.phoneNumberId && config.whatsapp.phoneNumberId !== '123456789') {
  tests.push({ name: 'WhatsApp Phone ID', status: '✅', message: 'Configured' });
} else {
  tests.push({ name: 'WhatsApp Phone ID', status: '⚠️', message: 'Still using placeholder value' });
}

// Test 5: Verify Token
if (config.whatsapp.verifyToken && config.whatsapp.verifyToken !== 'your_random_token_here') {
  tests.push({ name: 'Verify Token', status: '✅', message: 'Configured' });
} else {
  tests.push({ name: 'Verify Token', status: '⚠️', message: 'Still using placeholder value' });
}

// Test 6: Port
tests.push({ name: 'Server Port', status: '✅', message: `Port ${config.server.port}` });

// Test 7: Environment
tests.push({ name: 'Environment', status: '✅', message: config.server.nodeEnv });

// Print results
console.log('Test Results:\n');
tests.forEach(test => {
  console.log(`${test.status} ${test.name.padEnd(25)} ${test.message}`);
});

// Summary
console.log('\n=================================');
const ready = tests.filter(t => t.status === '✅').length;
const warnings = tests.filter(t => t.status === '⚠️').length;
const errors = tests.filter(t => t.status === '❌').length;

console.log(`Ready: ${ready}/${tests.length}`);
if (warnings > 0) {
  console.log(`⚠️  Warnings: ${warnings} (need to update placeholder values)`);
}
if (errors > 0) {
  console.log(`❌ Errors: ${errors}`);
}
console.log('=================================\n');

if (warnings > 0 || errors > 0) {
  console.log('❌ Configuration incomplete!');
  console.log('\nNext steps:');
  console.log('1. Edit .env file');
  console.log('2. Add your real API keys');
  console.log('3. Run this test again: node test-config.js');
  console.log('\nSee TODO.md for detailed setup instructions.\n');
  process.exit(1);
} else {
  console.log('✅ Configuration looks good!');
  console.log('\nNext steps:');
  console.log('1. Start server: npm run dev');
  console.log('2. Start ngrok: ngrok http 3000');
  console.log('3. Configure WhatsApp webhook');
  console.log('4. Send test message\n');
  process.exit(0);
}
