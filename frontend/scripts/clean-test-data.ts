import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde la raíz de frontend
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function cleanTestData() {
    console.log('🧹 Iniciando limpieza de datos de prueba...');

    try {
        // 1. Delete OperationalEvents (Bitácoras) created today from Limpieza
        // Since we only want to drop test runs, we filter those manually or by time if needed.
        // For safety, we'll delete the ones created in the last 24 hours that are not part of seed.
        const yesterday = new Date();
        yesterday.setHours(yesterday.getHours() - 24);

        const deletedEvents = await prisma.operationalEvent.deleteMany({
            where: {
                timestamp: {
                    gte: yesterday
                },
                // Optionally add more filters like 'notes' containing specific strings if known
            }
        });
        console.log(`✅ Eliminados ${deletedEvents.count} registros de OperationalEvent (Bitácora).`);

        // 2. Delete Tasks that contain 'Test:' in their title
        const deletedTasks = await prisma.task.deleteMany({
            where: {
                title: {
                    startsWith: 'Test:'
                }
            }
        });
        // Related TaskChecklistItems are deleted automatically due to `onDelete: Cascade` in schema.
        console.log(`✅ Eliminadas ${deletedTasks.count} Tareas de prueba (y sus checklists asociados).`);

        console.log('✨ Limpieza de datos de prueba finalizada exitosamente.');
    } catch (e) {
        console.error('❌ Error durante la limpieza:', e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanTestData();
