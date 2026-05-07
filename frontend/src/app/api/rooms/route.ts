import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';
import { Client } from 'pg';

export async function GET(request: NextRequest) {
    // 1. Authenticate with admin guard
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    const host = process.env.SUPABASE_HOST;
    const port = parseInt(process.env.SUPABASE_PORT || '6543', 10);
    const database = process.env.SUPABASE_DATABASE || 'postgres';
    const dbUser = process.env.SUPABASE_USERNAME;
    const dbPassword = process.env.SUPABASE_PASSWORD;

    if (!host || !dbUser || !dbPassword) {
        return NextResponse.json({ success: false, error: { code: 'CONFIG_ERROR', message: 'Missing Supabase credentials' } }, { status: 500 });
    }

    const client = new Client({
        host,
        port,
        database,
        user: dbUser,
        password: dbPassword,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 2. Fetch the current occupied rooms from Supabase
        const res = await client.query(`
            SELECT * 
            FROM public.ocupacion_historico 
            ORDER BY ultima_verificacion DESC 
            -- Limit just in case, though a hotel usually has < 500 rooms
            LIMIT 500;
        `);

        const occupiedData = res.rows;

        // 3. Create a map of occupied rooms keyed by their room number (habitacion)
        const occupiedMap = new Map();
        for (const row of occupiedData) {
            // Keep the most recent or distinct entry per room
            if (!occupiedMap.has(row.habitacion)) {
                occupiedMap.set(row.habitacion, row);
            }
        }

        // 4. Generate the full physical hotel layout (10 floors, 12 rooms per floor)
        const rooms = [];
        for (let floor = 1; floor <= 10; floor++) {
            for (let num = 1; num <= 12; num++) {
                const roomNumber = `${floor}${num.toString().padStart(2, '0')}`;

                const occupancy = occupiedMap.get(roomNumber);
                const isOccupied = !!occupancy;

                rooms.push({
                    id: `room-${roomNumber}`,
                    number: roomNumber,
                    floor: floor,
                    type: num <= 2 ? 'SUITE' : (num <= 6 ? 'DOUBLE' : 'SINGLE'),
                    status: isOccupied ? 'OCCUPIED' : 'AVAILABLE',
                    guest: isOccupied ? {
                        name: occupancy.huesped || null,
                        company: occupancy.empresa || null,
                        adults: occupancy.adultos || 0,
                        children: occupancy.ninos || 0,
                        check_in: occupancy.check_in || null,
                        check_out: occupancy.check_out || null,
                        last_updated: occupancy.ultima_verificacion || null,
                        roi: occupancy.roi ? Number(occupancy.roi) : 0
                    } : null
                });
            }
        }

        return NextResponse.json({ success: true, data: rooms });
    } catch (error) {
        console.error('Supabase query error:', error);
        return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: 'Error interno del servidor al consultar la base de datos' } }, { status: 500 });
    } finally {
        await client.end();
    }
}
