const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
    console.log('🔍 Testing Login Flow...\n');

    const email = 'admin@legacymark.com';
    const password = 'password123';

    // Step 1: Check if user exists
    console.log('Step 1: Checking if user exists...');
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log('❌ FAILED: User not found in database');
        return;
    }
    console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Name: ${user.name || 'N/A'}\n`);

    // Step 2: Verify password hash
    console.log('Step 2: Verifying password...');
    if (!user.passwordHash) {
        console.log('❌ FAILED: User has no password hash');
        return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
        console.log('❌ FAILED: Password does not match');
        console.log(`   Expected: password123`);
        return;
    }
    console.log(`✅ Password verified successfully\n`);

    // Step 3: Check environment variables
    console.log('Step 3: Checking environment variables...');
    const requiredEnvVars = ['AUTH_SECRET', 'NEXTAUTH_URL', 'DATABASE_URL'];
    let envOk = true;

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            console.log(`❌ Missing: ${envVar}`);
            envOk = false;
        } else {
            console.log(`✅ ${envVar} is set`);
        }
    }

    if (!envOk) {
        console.log('\n❌ FAILED: Missing required environment variables');
        return;
    }

    console.log('\n🎉 ALL CHECKS PASSED!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n✅ You should be able to log in at: http://localhost:3000/auth/login');
}

testLogin()
    .catch(e => {
        console.error('❌ Test Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
