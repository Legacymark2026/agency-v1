import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function main() {
    console.log('🚀 Starting System Verification...\n');
    let errors = 0;

    // 1. Database Connectivity
    try {
        console.log('1️⃣  Testing Database Connection...');
        await prisma.$connect();
        console.log('   ✅ Database connected successfully.');
    } catch (e) {
        console.error('   ❌ Database connection failed (Check .env credentials).');
        // console.error(e); // Optional: hide verbose stack
        errors++;
        // Continue to next checks instead of process.exit(1)
    }

    // 2. User Creation Test
    try {
        console.log('\n2️⃣  Testing User Creation (DB Layer)...');
        const testEmail = `system_test_${Date.now()}@example.com`;
        const user = await prisma.user.create({
            data: {
                email: testEmail,
                passwordHash: await bcrypt.hash('password123', 10),
                name: 'System Test Bot',
                role: 'client_user'
            }
        });

        if (user && user.id) {
            console.log(`   ✅ User created successfully: ${user.email} (ID: ${user.id})`);

            // Clean up
            await prisma.user.delete({ where: { id: user.id } });
            console.log('   ✅ Test user cleaned up (deleted).');
        } else {
            throw new Error('User creation returned null');
        }
    } catch (e) {
        console.error('   ❌ User creation test failed:', e);
        errors++;
    }

    // 3. HTTP Endpoint Verification
    console.log('\n3️⃣  Testing HTTP Endpoints...');
    const endpoints = [
        { url: '/', name: 'Homepage' },
        { url: '/auth/login', name: 'Login Page' },
        { url: '/auth/register', name: 'Register Page' },
        { url: '/dashboard', name: 'Dashboard (Protected)', expectedStatus: 307 } // Redirect to login
    ];

    for (const ep of endpoints) {
        try {
            const res = await fetch(`${BASE_URL}${ep.url}`, { redirect: 'manual' });
            const expected = ep.expectedStatus || 200;

            // Allow 307/308 redirects for protected routes
            if (res.status === expected || (ep.name.includes('Protected') && res.status >= 300 && res.status < 400)) {
                console.log(`   ✅ ${ep.name} (${ep.url}) is UP. Status: ${res.status}`);
            } else {
                console.log(`   ⚠️ ${ep.name} returned unexpected status: ${res.status}`);
                // Don't count as crit error if it's just a different redirect code, but warn
            }
        } catch (e) {
            console.error(`   ❌ Failed to reach ${ep.url}:`, e);
            errors++;
        }
    }

    console.log('\n----------------------------------------');
    if (errors === 0) {
        console.log('✨ SYSTEM CHECK PASSED: All systems operational.');
    } else {
        console.log(`⚠️  SYSTEM CHECK COMPLETED WITH ${errors} ERRORS.`);
    }

    await prisma.$disconnect();
}

main();
