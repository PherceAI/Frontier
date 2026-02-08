<?php
// Auth Controller - JWT and PIN Authentication

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Employee;
use App\Models\EmployeeSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends ApiController
{
    /**
     * POST /auth/admin/login
     * Admin login with email/password
     */
    public function adminLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return $this->error(
                'AUTH_INVALID_CREDENTIALS',
                'Email or password is incorrect',
                401
            );
        }

        if (!$user->is_active) {
            return $this->error(
                'AUTH_ACCOUNT_DISABLED',
                'Account is disabled',
                403
            );
        }

        // Generate JWT token
        $token = $this->generateJWT($user);

        return $this->success([
            'accessToken' => $token,
            'refreshToken' => $this->generateRefreshToken($user),
            'expiresIn' => 900, // 15 minutes
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'fullName' => $user->full_name,
                'role' => $user->role,
                'companyId' => $user->company_id,
            ],
        ]);
    }

    /**
     * POST /auth/admin/refresh
     * Refresh access token
     */
    public function adminRefresh(Request $request)
    {
        $request->validate([
            'refreshToken' => 'required|string',
        ]);

        // In production, validate refresh token from database
        // For now, decode and regenerate
        try {
            $payload = $this->decodeJWT($request->refreshToken);
            $user = User::find($payload['sub']);

            if (!$user) {
                return $this->error('AUTH_TOKEN_EXPIRED', 'Invalid refresh token', 401);
            }

            return $this->success([
                'accessToken' => $this->generateJWT($user),
                'expiresIn' => 900,
            ]);
        } catch (\Exception $e) {
            return $this->error('AUTH_TOKEN_EXPIRED', 'Invalid refresh token', 401);
        }
    }

    /**
     * GET /auth/admin/me
     * Get current user profile
     */
    public function adminMe(Request $request)
    {
        $user = $request->user;

        if (!$user) {
            return $this->error('AUTH_TOKEN_EXPIRED', 'Not authenticated', 401);
        }

        $company = $user->company;

        return $this->success([
            'id' => $user->id,
            'email' => $user->email,
            'fullName' => $user->full_name,
            'role' => $user->role,
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'code' => $company->code,
            ],
        ]);
    }

    /**
     * POST /auth/pin/login
     * Employee PIN login
     */
    public function pinLogin(Request $request)
    {
        $request->validate([
            'pin' => 'required|string|size:4',
        ]);

        // Efficient single-query lookup since we dropped plain text PINs
        // We can't do a direct hash lookup because bcrypt is salted.
        // But we can filter by company first (Single Tenant optimization)

        // Single Tenant: We assume company_id is fixed or we search all active employees
        // Optimization: Fetch id and hash for all active employees (small dataset < 100)
        $employees = Employee::where('is_active', true)
            ->select('id', 'access_pin_hash')
            ->get();

        $matchedEmployeeId = null;

        foreach ($employees as $employee) {
            if (Hash::check($request->pin, $employee->access_pin_hash)) {
                $matchedEmployeeId = $employee->id;
                break;
            }
        }

        if (!$matchedEmployeeId) {
            return $this->error(
                'AUTH_INVALID_CREDENTIALS',
                'PIN incorrecto',
                401
            );
        }

        $matchedEmployee = Employee::find($matchedEmployeeId);

        // Create session
        $sessionToken = Str::random(64);
        $expiresAt = now()->addHours(12);

        $session = EmployeeSession::create([
            'employee_id' => $matchedEmployee->id,
            'token_hash' => hash('sha256', $sessionToken),
            'expires_at' => $expiresAt,
            'last_activity' => now(),
            'is_active' => true,
        ]);

        // Load areas
        $areas = $matchedEmployee->areas()->where('is_active', true)->get();

        return $this->success([
            'sessionToken' => $sessionToken,
            'expiresAt' => $expiresAt->toIso8601String(),
            'employee' => [
                'id' => $matchedEmployee->id,
                'fullName' => $matchedEmployee->full_name,
                'areas' => $areas->map(fn($a) => [
                    'id' => $a->id,
                    'name' => $a->name,
                    'type' => $a->type,
                ]),
            ],
        ]);
    }

    /**
     * POST /auth/pin/logout
     * End employee session
     */
    public function pinLogout(Request $request)
    {
        $token = $request->header('x-session-token');

        if ($token) {
            EmployeeSession::where('token_hash', hash('sha256', $token))
                ->update(['is_active' => false]);
        }

        return $this->success(['message' => 'Session ended']);
    }

    // JWT Helpers
    private function generateJWT(User $user): string
    {
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'sub' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'companyId' => $user->company_id,
            'iat' => time(),
            'exp' => time() + 900, // 15 minutes
        ]));
        $signature = base64_encode(hash_hmac('sha256', "$header.$payload", config('app.jwt_secret', 'secret'), true));

        return "$header.$payload.$signature";
    }

    private function generateRefreshToken(User $user): string
    {
        $header = base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = base64_encode(json_encode([
            'sub' => $user->id,
            'type' => 'refresh',
            'iat' => time(),
            'exp' => time() + 604800, // 7 days
        ]));
        $signature = base64_encode(hash_hmac('sha256', "$header.$payload", config('app.jwt_secret', 'secret'), true));

        return "$header.$payload.$signature";
    }

    private function decodeJWT(string $token): array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new \Exception('Invalid token');
        }

        return json_decode(base64_decode($parts[1]), true);
    }
}
