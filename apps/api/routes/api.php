<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — V1
|--------------------------------------------------------------------------
|
| All API endpoints live under /api/v1/*. Never break v1 contract —
| introduce v2 for breaking changes. See CLAUDE.md for conventions.
|
*/

Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'status' => 'ok',
            'version' => '0.1.0',
            'service' => 'mypos-api',
            'timestamp' => now()->toIso8601String(),
            'locale' => app()->getLocale(),
            'timezone' => config('app.timezone'),
        ]);
    })->name('v1.health');

    // --- Auth (public) ---
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:10,1')
            ->name('v1.auth.login');

        // --- Auth (authenticated) ---
        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/me', [AuthController::class, 'me'])->name('v1.auth.me');
            Route::post('/logout', [AuthController::class, 'logout'])->name('v1.auth.logout');
        });
    });

    // Domain routes will be registered here as modules land.
});
