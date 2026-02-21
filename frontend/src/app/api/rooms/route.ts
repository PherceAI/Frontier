import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    const host = process.env.SUPABASE_HOST;
    const dbUser = process.env.SUPABASE_USERNAME;
    const pass = process.env.SUPABASE_PASSWORD;

    try {
        const url = `https://${host}/rest/v1/ocupacion?select=*&limit=100`;
        const supabaseKey = Buffer.from(`${dbUser}:${pass}`).toString('base64');

        const res = await fetch(url, {
            headers: { 'Authorization': `Basic ${supabaseKey}`, 'Content-Type': 'application/json' },
        });

        if (!res.ok) return NextResponse.json({ success: true, data: [] });
        const data = await res.json();
        return NextResponse.json({ success: true, data });
    } catch {
        return NextResponse.json({ success: true, data: [] });
    }
}
