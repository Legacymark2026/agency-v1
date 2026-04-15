
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting CRM Core Verifications...');

    // 1. Setup Test Company
    const company = await prisma.company.create({
        data: {
            name: 'Test Corp ' + Date.now(),
            slug: 'test-corp-' + Date.now(),
        }
    });
    console.log(`✅ Organization Created: ${company.name}`);

    // 2. Test Team Hierarchy (Deep Nesting)
    console.log('\nTesting Team Hierarchy...');

    // Level 1: Global
    const rootTeam = await prisma.team.create({
        data: {
            name: 'Global HQ',
            companyId: company.id,
            level: 0,
            path: '/'
        }
    });

    // Level 2: Region
    const regionTeam = await prisma.team.create({
        data: {
            name: 'North America',
            companyId: company.id,
            parentId: rootTeam.id,
            level: 1,
            path: `/${rootTeam.id}/`
        }
    });

    // Level 3: Division
    const divisionTeam = await prisma.team.create({
        data: {
            name: 'Sales Division',
            companyId: company.id,
            parentId: regionTeam.id,
            level: 2,
            path: `/${rootTeam.id}/${regionTeam.id}/`
        }
    });

    const retrievedDivision = await prisma.team.findUnique({
        where: { id: divisionTeam.id },
        include: { parent: { include: { parent: true } } }
    });

    if (retrievedDivision.parent.name === 'North America' &&
        retrievedDivision.parent.parent.name === 'Global HQ') {
        console.log('✅ Hierarchy Verified (3 Levels Deep)');
    } else {
        throw new Error('Hierarchy verification failed');
    }

    // 3. Test Custom Objects
    console.log('\nTesting Custom Object Engine...');

    // Define "Vehicle" Object
    const vehicleDef = await prisma.customObjectDefinition.create({
        data: {
            name: 'vehicle',
            label: 'Vehicle',
            companyId: company.id,
            fields: [
                { name: 'vin', type: 'text', required: true },
                { name: 'make', type: 'select', options: ['Toyota', 'Ford'] },
                { name: 'year', type: 'number' }
            ]
        }
    });
    console.log(`✅ Custom Object Definition Created: ${vehicleDef.label}`);

    // Insert Record
    const record = await prisma.customObjectRecord.create({
        data: {
            definitionId: vehicleDef.id,
            data: {
                vin: 'ABC-123',
                make: 'Toyota',
                year: 2024
            }
        }
    });
    console.log(`✅ Custom Record Inserted: ID ${record.id}`);

    // Verify Record Data
    if (record.data['vin'] === 'ABC-123') {
        console.log('✅ Custom Data Integrity Verified');
    } else {
        throw new Error('Data integrity failed');
    }

    // Cleanup
    await prisma.company.delete({ where: { id: company.id } }); // Cascades delete
    console.log('\n🧹 Cleanup successful');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
