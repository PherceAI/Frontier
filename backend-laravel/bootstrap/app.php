<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // CORS middleware for API
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

                // Keep 422 Validation formats standard or wrap them? 
                // Let's standardise generic errors first.
    
                return response()->json([
                    'success' => false,
                    'error' => [
                        'code' => 'API_ERROR',
                        'message' => $e->getMessage(),
                        'trace' => config('app.debug') ? $e->getTrace() : [],
                    ]
                ], $statusCode >= 100 && $statusCode < 600 ? $statusCode : 500);
            }
        });
    })->create();
