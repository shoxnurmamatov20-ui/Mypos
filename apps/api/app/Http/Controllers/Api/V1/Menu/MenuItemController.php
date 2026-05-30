<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Menu;

use App\Domain\Menu\Models\MenuItem;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Menu\StoreMenuItemRequest;
use App\Http\Requests\V1\Menu\UpdateMenuItemRequest;
use App\Http\Resources\V1\Menu\MenuItemResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

class MenuItemController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', MenuItem::class);

        $query = MenuItem::query()
            ->with('category')
            ->orderBy('sort_order')
            ->orderBy('created_at', 'desc');

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->string('category_id'));
        }
        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }
        if ($request->filled('q')) {
            $search = (string) $request->string('q');
            $query->where(function ($q) use ($search): void {
                $q->where('name->uz', 'like', "%{$search}%")
                    ->orWhere('name->ru', 'like', "%{$search}%")
                    ->orWhere('name->en', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->integer('per_page', 50), 200);

        return MenuItemResource::collection($query->paginate($perPage));
    }

    public function show(MenuItem $item): MenuItemResource
    {
        $this->authorize('view', $item);

        return MenuItemResource::make($item->load('category'));
    }

    public function store(StoreMenuItemRequest $request): JsonResponse
    {
        $this->authorize('create', MenuItem::class);

        $data = $request->validated();

        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']['uz'] ?? $data['name']['en']) . '-' . Str::random(6);
        }

        $item = MenuItem::create($data);

        return response()->json(
            ['data' => MenuItemResource::make($item->load('category'))],
            201,
        );
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $item): MenuItemResource
    {
        $this->authorize('update', $item);

        $item->update($request->validated());

        return MenuItemResource::make($item->fresh()->load('category'));
    }

    public function destroy(MenuItem $item): JsonResponse
    {
        $this->authorize('delete', $item);

        $item->delete();

        return response()->json(['data' => ['message' => "Mahsulot o'chirildi"]]);
    }
}
