import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
    const hash = bcrypt.hashSync('Admin123!', 10);
    console.log('Inserting hash:', hash);

    const user = await prisma.user.upsert({
        where: { email: 'admin@hotel.com' },
        update: {
            password_hash: hash,
            is_active: true,
            role: 'OWNER'
        },
        create: {
            id: '11111111-1111-1111-1111-123456789012',
            email: 'admin@hotel.com',
            password_hash: hash,
            full_name: 'Admin User',
            role: 'OWNER',
            is_active: true,
            company_id: '11111111-1111-1111-1111-111111111111',
        }
    });

    console.log('Update success for:', user.email);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
