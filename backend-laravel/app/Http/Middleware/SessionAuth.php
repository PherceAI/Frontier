<?php
// Session Authentication Middleware for Employee PIN routes

namespace App\Http\Middleware;

use App\Models\EmployeeSession;
use Closure;
use Illuminate\Http\Request;

class SessionAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->header('x-session-token');

        if (!$token) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'AUTH_TOKEN_EXPIRED',
                    'message' => 'No session token provided',
                ],
            ], 401);
        }

        try {
            // Find active session
            $session = EmployeeSession::with('employee.areas')
                ->where('token_hash', hash('sha256', $token))
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->first();

            if (!$session) {
                throw new \Exception('Session not found or expired');
            }

            // Check employee is active
            if (!$session->employee->is_active) {
                throw new \Exception('Employee account is disabled');
            }

            // Update last activity
            $session->update(['last_activity' => now()]);

            // Attach session and employee to request using merge to ensure availability in FormRequests
            $request->merge([
                'employee_session' => $session,
                'employee' => $session->employee,
            ]);

            // Also set as properties for backward compatibility
            $request->employee_session = $session;
            $request->employee = $session->employee;

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
