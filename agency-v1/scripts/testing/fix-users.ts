import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({ include: { companies: true } });
        console.log(`Total users: ${users.length}`);

        const missing = users.filter(u => u.companies.length === 0);
        console.log(`Missing CompanyUser: ${missing.length}`);

        const eiber = users.find(u => u.name && u.name.toLowerCase().includes('eiber'));
        if (eiber) {
            console.log('Eiber role:', eiber.role);
            console.log('Eiber companies count:', eiber.companies.length);
            if (eiber.companies.length > 0) {
                console.log('Eiber CompanyUser[0]:', eiber.companies[0]);
            }
        }

        if (missing.length > 0) {
            console.log('Fetching main company...');
            const company = await prisma.company.findFirst();
            if (!company) {
                console.log('No company found, aborting.');
                return;
            }

            const rolesArray = (company.defaultCompanySettings as any)?.customRoles || [];

            for (const u of missing) {
                console.log(`Fixing user ${u.name} (${u.email}) with role ${u.role}...`);
                const selectedCustomRole = rolesArray.find((r: any) => r.id === u.role);
                let newPermissions: string[] = [];

                if (selectedCustomRole) {
                    newPermissions = selectedCustomRole.permissions || [];
                } else if (u.role === 'super_admin' || u.role === 'admin') {
                    newPermissions = ["admin.all"];
                }

                await prisma.companyUser.create({
                    data: {
                        userId: u.id,
                        companyId: company.id,
                        permissions: newPermissions
                    }
                });
                console.log(`Created CompanyUser for ${u.email} with permissions:`, newPermissions);
            }
            console.log('Fix complete!');
        } else {
            console.log('No users to fix.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
