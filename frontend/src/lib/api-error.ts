import { NextRequest, NextResponse } from 'next/server';

export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly details?: unknown;

    constructor(code: string, message: string, statusCode: number = 500, details?: unknown) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export const apiResponse = {
    success: <T>(data: T, statusCode: number = 200) => {
        return NextResponse.json({ success: true, data }, { status: statusCode });
    },
    error: (code: string, message: string, statusCode: number = 500, details?: unknown) => {
        return NextResponse.json(
            { success: false, error: { code, message, details } },
            { status: statusCode }
        );
    },
    badRequest: (message: string, code = 'BAD_REQUEST', details?: unknown) => {
        return NextResponse.json(
            { success: false, error: { code, message, details } },
            { status: 400 }
        );
    },
    unauthorized: (message: string = 'No autorizado', code = 'UNAUTHORIZED') => {
        return NextResponse.json(
            { success: false, error: { code, message } },
            { status: 401 }
        );
    },
    forbidden: (message: string = 'Acceso denegado', code = 'FORBIDDEN') => {
        return NextResponse.json(
            { success: false, error: { code, message } },
            { status: 403 }
        );
    },
    notFound: (message: string = 'Recurso no encontrado', code = 'NOT_FOUND') => {
        return NextResponse.json(
            { success: false, error: { code, message } },
            { status: 404 }
        );
    },
    internalServerError: (message: string = 'Error interno del servidor', details?: unknown) => {
        // In production, we might want to hide details
        const isDev = process.env.NODE_ENV !== 'production';
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: isDev ? message : 'Error interno del servidor',
                    details: isDev ? details : undefined
                }
            },
            { status: 500 }
        );
    }
};

type ApiHandler = (req: NextRequest, ...args: any[]) => Promise<NextResponse> | NextResponse;

export function withApiErrorHandling(handler: ApiHandler): ApiHandler {
    return async (req: NextRequest, ...args: any[]) => {
        try {
            return await handler(req, ...args);
        } catch (error) {
            console.error('[API Error]', error);

            if (error instanceof AppError) {
                return apiResponse.error(error.code, error.message, error.statusCode, error.details);
            }

            // Handle Prisma specific errors here if needed in the future
            // (e.g., P2002 for unique constraint violations)

            if (error instanceof Error) {
                return apiResponse.internalServerError(error.message);
            }

            return apiResponse.internalServerError('An unexpected error occurred');
        }
    };
}
