#!/usr/bin/env node

/**
 * Generate secure random secrets for environment variables
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('\n🔐 Generating secure secrets for your .env file\n');
console.log('Copy these values to your .env file:\n');
console.log('─'.repeat(80));

console.log('\n# JWT Configuration');
console.log(`JWT_SECRET=${crypto.randomBytes(64).toString('hex')}`);
console.log(`REFRESH_SECRET=${crypto.randomBytes(64).toString('hex')}`);

console.log('\n# Encryption Configuration');
console.log(`ENCRYPTION_KEY=${crypto.randomBytes(32).toString('hex')}`);

console.log('\n' + '─'.repeat(80));
console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
console.log('   1. Never commit these secrets to version control');
console.log('   2. Use different secrets for each environment (dev/staging/prod)');
console.log('   3. Rotate secrets regularly (every 3-6 months)');
console.log('   4. Store production secrets in a secure vault (AWS Secrets Manager, etc.)');
console.log('   5. Add .env to .gitignore if not already present\n');