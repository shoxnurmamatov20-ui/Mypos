<?php

use Illuminate\Http\Request;
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

    // Domain routes will be registered here as modules land.
    // Example:
    // Route::middleware('auth:sanctum')->group(function () {
    //     Route::apiResource('menu-items', MenuItemController::class);
    // });
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
