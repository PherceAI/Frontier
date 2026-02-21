import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// ─── JWT ──────────────────────────────────────────────────────────────────

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET!);

export async function signJwt(payload: {
    sub: string;
    email: string;
    role: string;
    companyId: string;
}): Promise<string> {
    const expiresIn = parseInt(process.env.JWT_EXPIRES_IN ?? '900', 10);
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(`${expiresIn}s`)
        .setIssuedAt()
        .sign(getJwtSecret());
}

export async function signRefreshToken(sub: string): Promise<string> {
    const expiresIn = parseInt(process.env.JWT_REFRESH_EXPIRES_IN ?? '604800', 10);
    return new SignJWT({ sub, type: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(`${expiresIn}s`)
        .setIssuedAt()
        .sign(getJwtSecret());
}

export async function verifyJwt(token: string) {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        return payload as { sub: string; email: string; role: string; companyId: string };
    } catch {
        return null;
    }
}

// ─── Session Token ────────────────────────────────────────────────────────

export function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export function generateSessionToken(employeeId: string): string {
    return `${employeeId}.${randomBytes(32).toString('hex')}`;
}

export async function verifySessionToken(token: string) {
    if (!token) return null;

    const tokenHash = hashToken(token);
    const session = await prisma.employeeSession.findFirst({
        where: { token_hash: tokenHash, is_active: true, expires_at: { gt: new Date() } },
        include: {
            employee: {
                include: {
                    areas: {
                        where: { area: { is_active: true } },
                        include: { area: true },
                    },
                },
            },
        },
    });

    if (!session) return null;

    // Update last_activity
    await prisma.employeeSession.update({
        where: { id: session.id },
        data: { last_activity: new Date() },
    });

    return { session, employee: session.employee };
}

// ─── Bcrypt ───────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
}
