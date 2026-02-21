import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isErrorResponse } from '@/lib/auth/guards';

export async function GET(request: NextRequest) {
    const user = await requireAdmin(request);
    if (isErrorResponse(user)) return user;

    return NextResponse.json({
        success: true,
        data: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            company: user.company,
        },
    });
}
