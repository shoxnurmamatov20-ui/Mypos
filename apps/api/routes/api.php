<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Menu\MenuCategoryController;
use App\Http\Controllers\Api\V1\Menu\MenuItemController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — V1
|--------------------------------------------------------------------------
| All API endpoints live under /api/v1/*. Never break v1 contract —
| introduce v2 for breaking changes. See CLAUDE.md for conventions.
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

    // --- Auth ---
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:10,1')
            ->name('v1.auth.login');

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/me', [AuthController::class, 'me'])->name('v1.auth.me');
            Route::post('/logout', [AuthController::class, 'logout'])->name('v1.auth.logout');
        });
    });

    // --- Authenticated domain routes ---
    Route::middleware('auth:sanctum')->group(function () {
        // Menu
        Route::prefix('menu')->group(function () {
            // Categories
            Route::get('/categories', [MenuCategoryController::class, 'index'])->name('v1.menu.categories.index');
            Route::post('/categories', [MenuCategoryController::class, 'store'])->name('v1.menu.categories.store');
            Route::get('/categories/{category}', [MenuCategoryController::class, 'show'])->name('v1.menu.categories.show');
            Route::patch('/categories/{category}', [MenuCategoryController::class, 'update'])->name('v1.menu.categories.update');
            Route::delete('/categories/{category}', [MenuCategoryController::class, 'destroy'])->name('v1.menu.categories.destroy');

            // Items
            Route::get('/items', [MenuItemController::class, 'index'])->name('v1.menu.items.index');
            Route::post('/items', [MenuItemController::class, 'store'])->name('v1.menu.items.store');
            Route::get('/items/{item}', [MenuItemController::class, 'show'])->name('v1.menu.items.show');
            Route::patch('/items/{item}', [MenuItemController::class, 'update'])->name('v1.menu.items.update');
            Route::delete('/items/{item}', [MenuItemController::class, 'destroy'])->name('v1.menu.items.destroy');
        });
    });
});
