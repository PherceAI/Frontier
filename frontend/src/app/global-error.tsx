'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center p-4">
                    <h2 className="text-2xl font-bold mb-4">Algo salió mal</h2>
                    <p className="mb-4 text-gray-600">
                        Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Intentar de nuevo
                    </button>
                    {process.env.NODE_ENV !== 'production' && (
                        <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-red-500 max-w-lg overflow-auto">
                            <p>{error.message}</p>
                            <pre>{error.stack}</pre>
                        </div>
                    )}
                </div>
            </body>
        </html>
    );
}
