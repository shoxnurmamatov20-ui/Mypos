<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Menu\MenuCategoryController;
use App\Http\Controllers\Api\V1\Menu\MenuItemController;
use App\Http\Controllers\Api\V1\Order\OrderController;
use App\Http\Controllers\Api\V1\Public\PublicMenuController;
use App\Http\Controllers\Api\V1\Public\PublicOrderController;
use App\Http\Controllers\Api\V1\Table\TableCategoryController;
use App\Http\Controllers\Api\V1\Table\TableController;
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

    // --- Public (unauthenticated) endpoints for QR-menu PWA ---
    Route::prefix('public')->group(function () {
        Route::get('/menu/{slug}', [PublicMenuController::class, 'show'])
            ->middleware('throttle:60,1')
            ->name('v1.public.menu.show');
        Route::post('/menu/{slug}/orders', [PublicOrderController::class, 'store'])
            ->middleware('throttle:30,1')
            ->name('v1.public.orders.store');
    });

    // --- Auth (public login + authenticated me/logout) ---
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
            Route::get('/categories', [MenuCategoryController::class, 'index'])->name('v1.menu.categories.index');
            Route::post('/categories', [MenuCategoryController::class, 'store'])->name('v1.menu.categories.store');
            Route::get('/categories/{category}', [MenuCategoryController::class, 'show'])->name('v1.menu.categories.show');
            Route::patch('/categories/{category}', [MenuCategoryController::class, 'update'])->name('v1.menu.categories.update');
            Route::delete('/categories/{category}', [MenuCategoryController::class, 'destroy'])->name('v1.menu.categories.destroy');

            Route::get('/items', [MenuItemController::class, 'index'])->name('v1.menu.items.index');
            Route::post('/items', [MenuItemController::class, 'store'])->name('v1.menu.items.store');
            Route::get('/items/{item}', [MenuItemController::class, 'show'])->name('v1.menu.items.show');
            Route::patch('/items/{item}', [MenuItemController::class, 'update'])->name('v1.menu.items.update');
            Route::delete('/items/{item}', [MenuItemController::class, 'destroy'])->name('v1.menu.items.destroy');
        });

        // Tables
        Route::prefix('tables')->group(function () {
            Route::get('/categories', [TableCategoryController::class, 'index'])->name('v1.tables.categories.index');
            Route::post('/categories', [TableCategoryController::class, 'store'])->name('v1.tables.categories.store');
            Route::patch('/categories/{tableCategory}', [TableCategoryController::class, 'update'])->name('v1.tables.categories.update');
            Route::delete('/categories/{tableCategory}', [TableCategoryController::class, 'destroy'])->name('v1.tables.categories.destroy');
        });
        Route::get('/tables', [TableController::class, 'index'])->name('v1.tables.index');
        Route::post('/tables', [TableController::class, 'store'])->name('v1.tables.store');
        Route::get('/tables/{table}', [TableController::class, 'show'])->name('v1.tables.show');
        Route::patch('/tables/{table}', [TableController::class, 'update'])->name('v1.tables.update');
        Route::patch('/tables/{table}/status', [TableController::class, 'updateStatus'])->name('v1.tables.status');
        Route::delete('/tables/{table}', [TableController::class, 'destroy'])->name('v1.tables.destroy');

        // Orders
        Route::prefix('orders')->group(function () {
            Route::get('/', [OrderController::class, 'index'])->name('v1.orders.index');
            Route::post('/', [OrderController::class, 'store'])->name('v1.orders.store');
            // Stats routes must be registered BEFORE /{order} to avoid route binding conflicts.
            Route::get('/stats/summary', [OrderController::class, 'summary'])->name('v1.orders.stats.summary');
            Route::get('/{order}', [OrderController::class, 'show'])->name('v1.orders.show');
            Route::patch('/{order}/status', [OrderController::class, 'updateStatus'])->name('v1.orders.status');
        });
    });
});
