<?php
// JWT Authentication Middleware for Admin routes

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;

class JwtAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_TOKEN_EXPIRED',
                    'message' => 'No token provided',
                ],
            ], 401);
        }

        try {
            // Decode JWT
            $parts = explode('.', $token);
            if (count($parts) !== 3) {
                throw new \Exception('Invalid token format');
            }

            $payload = json_decode(base64_decode($parts[1]), true);

            // Check expiration
            if (!isset($payload['exp']) || $payload['exp'] < time()) {
                throw new \Exception('Token expired');
            }

            // Find user
            $user = User::with('company')->find($payload['sub']);

            if (!$user || !$user->is_active) {
                throw new \Exception('User not found or inactive');
            }

            // Attach user to request
            $request->user = $user;

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_TOKEN_EXPIRED',
                    'message' => $e->getMessage(),
                ],
            ], 401);
        }

        return $next($request);
    }
}
