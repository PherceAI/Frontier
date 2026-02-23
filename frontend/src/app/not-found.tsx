import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <h2 className="text-4xl font-bold mb-4">404</h2>
            <p className="text-xl mb-8">Página no encontrada</p>
            <Link
                href="/"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Volver al inicio
            </Link>
        </div>
    );
}
