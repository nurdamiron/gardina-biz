#!/usr/bin/env node

/**
 * Generate VAPID keys for Web Push notifications
 * Run: node scripts/generate-vapid-keys.js
 */

import webpush from 'web-push';

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:support@gardina.kz`);
console.log('\n============================\n');
console.log('PUBLIC KEY (for frontend):');
console.log(vapidKeys.publicKey);
console.log('\nPRIVATE KEY (keep secret!):');
console.log(vapidKeys.privateKey);
