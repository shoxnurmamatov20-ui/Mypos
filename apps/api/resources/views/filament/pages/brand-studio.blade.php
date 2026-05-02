<x-filament-panels::page>
    @if ($isSuperAdmin)
        <x-filament::section>
            <x-slot name="heading">{{ __('brand.tenant_selector.label') }}</x-slot>
            <x-slot name="description">{{ __('brand.tenant_selector.help') }}</x-slot>
            <select
                wire:model.live="selectedTenantId"
                class="block w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
            >
                <option value="">{{ __('brand.tenant_selector.placeholder') }}</option>
                @php
                    $currentTenantId = $previewState['tenant']['id'] ?? null;
                @endphp
                @foreach (\App\Domain\Tenant\Models\Tenant::query()->withoutGlobalScopes()->orderBy('name')->get(['id', 'name']) as $t)
                    <option value="{{ $t->id }}" @selected($t->id === $currentTenantId)>
                        {{ $t->name }}
                    </option>
                @endforeach
            </select>
        </x-filament::section>
    @endif

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {{-- Left: form --}}
        <div class="xl:col-span-2">
            <form wire:submit="save" class="space-y-6">
                {{ $this->form }}

                <div class="flex items-center gap-3">
                    <x-filament::button type="submit" icon="heroicon-o-check">
                        {{ __('brand.actions.save') }}
                    </x-filament::button>
                    @if ($previewState['preview_url'] ?? null)
                        <x-filament::link
                            :href="$previewState['preview_url']"
                            target="_blank"
                            color="gray"
                            icon="heroicon-o-arrow-top-right-on-square"
                        >
                            {{ __('brand.actions.open_preview') }}
                        </x-filament::link>
                    @endif
                </div>
            </form>
        </div>

        {{-- Right: live preview --}}
        <div class="xl:col-span-1">
            <div class="sticky top-6 space-y-4">
                <x-filament::section>
                    <x-slot name="heading">
                        {{ __('brand.preview.title') }}
                    </x-slot>
                    <x-slot name="description">
                        {{ __('brand.preview.description') }}
                    </x-slot>

                    @php
                        $brandData = $previewState['data'] ?? [];
                        $primary = $brandData['primary_color'] ?? '#EA7C69';
                        $accent = $brandData['accent_color'] ?? '#9333EA';
                        $text = $brandData['text_color'] ?? '#0F172A';
                        $bg = $brandData['background_color'] ?? '#FFFFFF';
                        $font = $brandData['font_family'] ?? 'Inter';
                        $fontHeading = $brandData['font_heading'] ?? null;
                        $heroLocale = app()->getLocale();

                        $pickLocaleString = function (mixed $field, string $locale, string $fallback): string {
                            if (is_array($field)) {
                                if (isset($field[$locale]) && is_string($field[$locale]) && $field[$locale] !== '') {
                                    return $field[$locale];
                                }
                                if (isset($field['uz']) && is_string($field['uz']) && $field['uz'] !== '') {
                                    return $field['uz'];
                                }
                            }
                            return $fallback;
                        };

                        $heroTitle = $pickLocaleString($brandData['hero_title'] ?? null, $heroLocale, __('brand.preview.sample_hero_title'));
                        $heroSubtitle = $pickLocaleString($brandData['hero_subtitle'] ?? null, $heroLocale, __('brand.preview.sample_hero_subtitle'));
                        $tagline = $pickLocaleString($brandData['tagline'] ?? null, $heroLocale, '');
                        $logo = $brandData['logo_url'] ?? null;
                        $hero = $brandData['hero_image_url'] ?? null;
                        $tenantName = $previewState['tenant']['name'] ?? __('brand.preview.sample_brand');

                        $logoSrc = null;
                        if (is_string($logo) && $logo !== '') {
                            $logoSrc = str_starts_with($logo, 'http') ? $logo : \Illuminate\Support\Facades\Storage::disk(\App\Filament\Pages\BrandStudio\BrandFormSchema::ASSET_DISK)->url($logo);
                        }
                        $heroSrc = null;
                        if (is_string($hero) && $hero !== '') {
                            $heroSrc = str_starts_with($hero, 'http') ? $hero : \Illuminate\Support\Facades\Storage::disk(\App\Filament\Pages\BrandStudio\BrandFormSchema::ASSET_DISK)->url($hero);
                        }
                    @endphp

                    <div
                        class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm"
                        style="
                            background:{{ $bg }};
                            color:{{ $text }};
                            font-family:'{{ $font }}', system-ui, sans-serif;
                        "
                    >
                        {{-- Hero / cover --}}
                        <div
                            class="relative h-32 w-full flex items-end p-3"
                            style="background:linear-gradient(135deg, {{ $primary }}, {{ $accent }});"
                        >
                            @if ($heroSrc)
                                <img
                                    src="{{ $heroSrc }}"
                                    alt="hero"
                                    class="absolute inset-0 w-full h-full object-cover opacity-60"
                                />
                            @endif
                            <div class="relative z-10 text-white">
                                @if ($logoSrc)
                                    <img src="{{ $logoSrc }}" alt="logo" class="h-8 w-auto mb-1 bg-white/80 rounded p-1" />
                                @endif
                                <div
                                    class="text-base font-semibold"
                                    style="font-family:'{{ $fontHeading ?? $font }}', system-ui, sans-serif;"
                                >
                                    {{ $tenantName }}
                                </div>
                            </div>
                        </div>

                        {{-- Hero copy --}}
                        <div class="px-4 pt-4 pb-3">
                            <h3
                                class="text-lg leading-tight"
                                style="
                                    color:{{ $text }};
                                    font-family:'{{ $fontHeading ?? $font }}', system-ui, sans-serif;
                                    font-weight:700;
                                "
                            >
                                {{ $heroTitle }}
                            </h3>
                            <p class="text-xs mt-1 opacity-70">
                                {{ $heroSubtitle }}
                            </p>
                            @if ($tagline)
                                <div
                                    class="inline-block mt-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded"
                                    style="background:{{ $accent }}; color:white;"
                                >
                                    {{ $tagline }}
                                </div>
                            @endif
                        </div>

                        {{-- Sample menu rows --}}
                        <div class="border-t border-gray-200 dark:border-gray-700">
                            @foreach ([
                                ['name' => __('brand.preview.menu_sample_1'), 'price' => '45 000'],
                                ['name' => __('brand.preview.menu_sample_2'), 'price' => '32 000'],
                                ['name' => __('brand.preview.menu_sample_3'), 'price' => '78 000'],
                            ] as $item)
                                <div class="flex items-center justify-between px-4 py-2 text-sm border-b border-gray-100 dark:border-gray-800">
                                    <span style="color:{{ $text }};">{{ $item['name'] }}</span>
                                    <span
                                        class="font-medium"
                                        style="color:{{ $primary }};"
                                    >{{ $item['price'] }} {{ __('brand.preview.currency') }}</span>
                                </div>
                            @endforeach
                        </div>

                        {{-- Sample CTA button --}}
                        <div class="px-4 py-3">
                            <button
                                type="button"
                                class="w-full text-sm font-semibold py-2 rounded transition"
                                style="background:{{ $primary }}; color:white;"
                            >
                                {{ __('brand.preview.cta') }}
                            </button>
                        </div>
                    </div>

                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-3">
                        {{ __('brand.preview.note') }}
                    </div>
                </x-filament::section>

                {{-- Color swatch palette --}}
                <x-filament::section>
                    <x-slot name="heading">{{ __('brand.preview.swatches') }}</x-slot>
                    <div class="grid grid-cols-4 gap-2">
                        @foreach ([
                            ['label' => __('brand.colors.primary'), 'value' => $primary],
                            ['label' => __('brand.colors.accent'), 'value' => $accent],
                            ['label' => __('brand.colors.text'), 'value' => $text],
                            ['label' => __('brand.colors.background'), 'value' => $bg],
                        ] as $sw)
                            <div class="flex flex-col items-center gap-1">
                                <div
                                    class="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                                    style="background:{{ $sw['value'] }};"
                                ></div>
                                <div class="text-[10px] uppercase tracking-wide opacity-70 text-center">
                                    {{ $sw['label'] }}
                                </div>
                                <div class="text-[10px] font-mono">{{ $sw['value'] }}</div>
                            </div>
                        @endforeach
                    </div>
                </x-filament::section>
            </div>
        </div>
    </div>
</x-filament-panels::page>
