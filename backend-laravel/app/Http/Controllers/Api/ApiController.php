<?php
// Base API Controller with standard response helpers

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ApiController extends Controller
{
    /**
     * Standard success response
     */
    protected function success($data, int $status = 200, array $meta = []): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => array_merge([
                'timestamp' => now()->toIso8601String(),
                'requestId' => request()->header('X-Request-ID', uniqid('req_')),
            ], $meta),
        ], $status);
    }

    /**
     * Paginated success response
     */
    protected function paginated($data, $pagination): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'pagination' => $pagination,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'requestId' => request()->header('X-Request-ID', uniqid('req_')),
            ],
        ]);
    }

    /**
     * Standard error response
     */
    protected function error(string $code, string $message, int $status = 400, $details = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'requestId' => request()->header('X-Request-ID', uniqid('req_')),
            ],
        ], $status);
    }
}
