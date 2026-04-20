<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Customer\CustomerController;
use App\Http\Controllers\Api\V1\Employee\ClockController;
use App\Http\Controllers\Api\V1\Employee\EmployeeController;
use App\Http\Controllers\Api\V1\Employee\ShiftController;
use App\Http\Controllers\Api\V1\Inventory\IngredientController;
use App\Http\Controllers\Api\V1\Inventory\InventoryReportController;
use App\Http\Controllers\Api\V1\Inventory\RecipeController;
use App\Http\Controllers\Api\V1\Inventory\StockMovementController;
use App\Http\Controllers\Api\V1\Menu\MenuCategoryController;
use App\Http\Controllers\Api\V1\Menu\MenuItemController;
use App\Http\Controllers\Api\V1\Order\OrderController;
use App\Http\Controllers\Api\V1\Payment\PaymentController;
use App\Http\Controllers\Api\V1\Public\PublicMenuController;
use App\Http\Controllers\Api\V1\Public\PublicOrderController;
use App\Http\Controllers\Api\V1\Table\TableCategoryController;
use App\Http\Controllers\Api\V1\Table\TableController;
use App\Http\Controllers\Api\V1\Webhook\ClickWebhookController;
use App\Http\Controllers\Api\V1\Webhook\PaymeWebhookController;
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

    // --- Public payment webhooks (no auth, no CSRF) ---
    Route::prefix('webhooks')->group(function () {
        Route::post('/click', [ClickWebhookController::class, 'handle'])->name('v1.webhooks.click');
        Route::post('/payme', [PaymeWebhookController::class, 'handle'])->name('v1.webhooks.payme');
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

        // Customers
        Route::prefix('customers')->group(function () {
            Route::get('/', [CustomerController::class, 'index'])->name('v1.customers.index');
            Route::post('/', [CustomerController::class, 'store'])->name('v1.customers.store');
            Route::get('/{customer}', [CustomerController::class, 'show'])->name('v1.customers.show');
            Route::patch('/{customer}', [CustomerController::class, 'update'])->name('v1.customers.update');
            Route::delete('/{customer}', [CustomerController::class, 'destroy'])->name('v1.customers.destroy');
        });

        // Employees
        Route::prefix('employees')->group(function () {
            Route::get('/', [EmployeeController::class, 'index'])->name('v1.employees.index');
            Route::post('/', [EmployeeController::class, 'store'])->name('v1.employees.store');
            Route::get('/{employee}', [EmployeeController::class, 'show'])->name('v1.employees.show');
            Route::patch('/{employee}', [EmployeeController::class, 'update'])->name('v1.employees.update');
            Route::delete('/{employee}', [EmployeeController::class, 'destroy'])->name('v1.employees.destroy');
        });

        // Shifts
        Route::prefix('shifts')->group(function () {
            Route::get('/', [ShiftController::class, 'index'])->name('v1.shifts.index');
            Route::post('/', [ShiftController::class, 'store'])->name('v1.shifts.store');
            Route::delete('/{shift}', [ShiftController::class, 'destroy'])->name('v1.shifts.destroy');
        });

        // Clock in/out
        Route::post('/clock/in', [ClockController::class, 'clockIn'])->name('v1.clock.in');
        Route::post('/clock/out', [ClockController::class, 'clockOut'])->name('v1.clock.out');

        // Inventory
        Route::prefix('inventory')->group(function () {
            Route::get('/ingredients', [IngredientController::class, 'index'])->name('v1.inventory.ingredients.index');
            Route::post('/ingredients', [IngredientController::class, 'store'])->name('v1.inventory.ingredients.store');
            Route::get('/ingredients/{ingredient}', [IngredientController::class, 'show'])->name('v1.inventory.ingredients.show');
            Route::patch('/ingredients/{ingredient}', [IngredientController::class, 'update'])->name('v1.inventory.ingredients.update');
            Route::delete('/ingredients/{ingredient}', [IngredientController::class, 'destroy'])->name('v1.inventory.ingredients.destroy');
            Route::post('/ingredients/{ingredient}/adjust', [StockMovementController::class, 'adjust'])->name('v1.inventory.ingredients.adjust');
            Route::get('/ingredients/{ingredient}/movements', [StockMovementController::class, 'index'])->name('v1.inventory.movements.index');
            Route::get('/recipes', [RecipeController::class, 'index'])->name('v1.inventory.recipes.index');
            Route::post('/recipes', [RecipeController::class, 'store'])->name('v1.inventory.recipes.store');
            Route::delete('/recipes/{recipe}', [RecipeController::class, 'destroy'])->name('v1.inventory.recipes.destroy');
            Route::get('/low-stock', [InventoryReportController::class, 'lowStock'])->name('v1.inventory.low_stock');
            Route::get('/valuation', [InventoryReportController::class, 'valuation'])->name('v1.inventory.valuation');
        });

        // Payments
        Route::prefix('payments')->group(function () {
            Route::post('/', [PaymentController::class, 'store'])->name('v1.payments.store');
            Route::get('/{payment}', [PaymentController::class, 'show'])->name('v1.payments.show');
            Route::post('/{payment}/capture', [PaymentController::class, 'captureCash'])->name('v1.payments.capture');
            Route::post('/{payment}/refund', [PaymentController::class, 'refund'])->name('v1.payments.refund');
        });
    });
});
