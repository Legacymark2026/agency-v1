#!/usr/bin/env node

/**
 * Pre-Deployment Verification Script
 * Verifica que el proyecto esté listo para producción
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verificando preparación para producción...\n');

let errors = [];
let warnings = [];
let checks = 0;

// Helper para verificar archivos
function checkFileExists(filePath, description) {
    checks++;
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${description}`);
        return true;
    } else {
        errors.push(`❌ ${description} - Archivo no encontrado: ${filePath}`);
        console.log(`❌ ${description}`);
        return false;
    }
}

// Helper para verificar contenido
function checkFileContent(filePath, searchString, description) {
    checks++;
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(searchString)) {
            console.log(`✅ ${description}`);
            return true;
        } else {
            warnings.push(`⚠️  ${description}`);
            console.log(`⚠️  ${description}`);
            return false;
        }
    } catch (e) {
        errors.push(`❌ ${description} - Error leyendo archivo`);
        console.log(`❌ ${description}`);
        return false;
    }
}

console.log('📋 VERIFICACIÓN DE ARCHIVOS\n');

// Archivos esenciales
checkFileExists('.env.example', 'Template de variables de entorno');
checkFileExists('vercel.json', 'Configuración de Vercel');
checkFileExists('DEPLOYMENT.md', 'Documentación de deployment');
checkFileExists('.gitignore', 'Archivo .gitignore');
checkFileExists('prisma/schema.prisma', 'Schema de Prisma');

console.log('\n📦 VERIFICACIÓN DE PACKAGE.JSON\n');

// Scripts necesarios
checkFileContent('package.json', 'db:migrate:deploy', 'Script de migración para producción');
checkFileContent('package.json', 'vercel-build', 'Script de build para Vercel');
checkFileContent('package.json', 'type-check', 'Script de verificación de tipos');

console.log('\n🔐 VERIFICACIÓN DE SEGURIDAD\n');

// .gitignore
checkFileContent('.gitignore', '.env', '.env está en .gitignore');
checkFileContent('.gitignore', '.env*.local', 'Variables locales en .gitignore');

// Verificar que .env no esté commiteado
try {
    execSync('git ls-files .env', { encoding: 'utf8' });
    errors.push('❌ CRÍTICO: .env está en Git! Ejecuta: git rm --cached .env');
    console.log('❌ .env NO debe estar en Git');
} catch (e) {
    console.log('✅ .env no está en Git');
    checks++;
}

console.log('\n🗄️  VERIFICACIÓN DE BASE DE DATOS\n');

// Verificar migraciones
const migrationsDir = 'prisma/migrations';
if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir);
    if (migrations.length > 0) {
        console.log(`✅ ${migrations.length} migración(es) encontrada(s)`);
        checks++;
    } else {
        warnings.push('⚠️  No hay migraciones. Considera crear una inicial.');
        console.log('⚠️  No hay migraciones');
    }
} else {
    warnings.push('⚠️  Directorio de migraciones no existe');
    console.log('⚠️  Directorio de migraciones no existe');
}

console.log('\n🔨 VERIFICACIÓN DE BUILD\n');

// Intentar build local (comentado para no ejecutar siempre)
try {
    console.log('⏭️  Saltando build (ejecuta manualmente: npm run build)');
    // execSync('npm run build', { stdio: 'inherit' });
    // console.log('✅ Build exitoso');
    // checks++;
} catch (e) {
    // errors.push('❌ Build falló');
    // console.log('❌ Build falló');
}

console.log('\n📊 RESUMEN\n');
console.log(`Verificaciones completadas: ${checks}`);
console.log(`Errores: ${errors.length}`);
console.log(`Advertencias: ${warnings.length}\n`);

if (errors.length > 0) {
    console.log('❌ ERRORES CRÍTICOS:\n');
    errors.forEach(err => console.log(err));
    console.log('');
}

if (warnings.length > 0) {
    console.log('⚠️  ADVERTENCIAS:\n');
    warnings.forEach(warn => console.log(warn));
    console.log('');
}

if (errors.length === 0) {
    console.log('✅ ¡Proyecto listo para producción!\n');
    console.log('Próximos pasos:');
    console.log('1. Configurar variables de entorno en Vercel/Railway');
    console.log('2. Conectar repositorio GitHub');
    console.log('3. Deploy automático en push a main\n');
    process.exit(0);
} else {
    console.log('❌ Corrige los errores antes de desplegar\n');
    process.exit(1);
}
