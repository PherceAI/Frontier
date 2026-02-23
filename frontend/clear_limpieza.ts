import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const areas = await prisma.operationalArea.findMany({
        where: { name: { contains: 'limpieza', mode: 'insensitive' } }
    });

    if (areas.length === 0) {
        console.log("No Limpieza areas found, clearing global test items just in case...");
        const res = await prisma.operationalEvent.deleteMany({
            where: { event_type: 'LIMPIEZA' }
        });
        console.log(`Fallback: Deleted ${res.count} events with event_type=LIMPIEZA`);
        return;
    }

    const areaIds = areas.map(a => a.id);
    const events = await prisma.operationalEvent.findMany({
        where: {
            area_id: { in: areaIds }
        }
    });

    console.log(`Found ${events.length} target events in Limpieza areas.`);

    const result = await prisma.operationalEvent.deleteMany({
        where: {
            area_id: { in: areaIds }
        }
    });

    console.log(`Deleted ${result.count} test events from Limpieza.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
