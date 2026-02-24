import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting passwords and PINs...');

    await prisma.user.update({
        where: { email: 'admin@hotel.com' },
        data: { password_hash: bcrypt.hashSync('Admin123!', 10) }
    });
    console.log('Admin password updated to Admin123!');

    await prisma.employee.update({
        where: { company_id_employee_code: { company_id: '11111111-1111-1111-1111-111111111111', employee_code: 'EMP-001' } },
        data: { access_pin_hash: bcrypt.hashSync('1234', 10), access_pin_plain: '1234' }
    });
    console.log('EMP-001 PIN updated to 1234');

    await prisma.employee.update({
        where: { company_id_employee_code: { company_id: '11111111-1111-1111-1111-111111111111', employee_code: 'EMP-002' } },
        data: { access_pin_hash: bcrypt.hashSync('5678', 10), access_pin_plain: '5678' }
    });
    console.log('EMP-002 PIN updated to 5678');

    await prisma.employee.update({
        where: { company_id_employee_code: { company_id: '11111111-1111-1111-1111-111111111111', employee_code: 'EMP-003' } },
        data: { access_pin_hash: bcrypt.hashSync('9012', 10), access_pin_plain: '9012' }
    });
    console.log('EMP-003 PIN updated to 9012');

    console.log('All done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
