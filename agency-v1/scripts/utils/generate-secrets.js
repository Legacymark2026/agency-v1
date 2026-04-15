#!/usr/bin/env node

/**
 * Environment Setup Helper
 * Ayuda a generar valores seguros para variables de entorno
 */

const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔐 Generador de Variables de Entorno Seguras\n');

// Generar AUTH_SECRET
const authSecret = crypto.randomBytes(32).toString('base64');
console.log('✅ AUTH_SECRET generado:\n');
console.log(`AUTH_SECRET="${authSecret}"\n`);

// Generar VERIFY_TOKEN para Meta
const verifyToken = crypto.randomBytes(16).toString('hex');
console.log('✅ META_VERIFY_TOKEN generado:\n');
console.log(`META_VERIFY_TOKEN="${verifyToken}"\n`);

console.log('📋 Copia estos valores a tu archivo .env y a Vercel/Railway\n');

console.log('⚠️  IMPORTANTE: Guarda estos valores de forma segura');
console.log('   - NO los compartas públicamente');
console.log('   - NO los commitees a Git');
console.log('   - Úsalos solo en variables de entorno\n');

console.log('📝 Próximos pasos:');
console.log('1. Agrega AUTH_SECRET a .env local y Vercel');
console.log('2. Agrega META_VERIFY_TOKEN si usas Meta webhooks');
console.log('3. Completa el resto de variables desde .env.example\n');

rl.close();
