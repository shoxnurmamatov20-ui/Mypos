<x-filament-panels::page>
    <form wire:submit.prevent="generateMenu" class="space-y-6">
        {{ $this->form }}
    </form>

    {{-- Tab 1 footer: "Save to Menu" appears once results have been generated --}}
    @if (! empty($this->data['menu']['results'] ?? []))
        <x-filament::section>
            <div class="flex items-center justify-between gap-3">
                <div>
                    <p class="text-sm font-medium">
                        {{ __('ai_studio.menu.save_help', ['count' => count($this->data['menu']['results'])]) }}
                    </p>
                </div>
                <x-filament::button wire:click="saveGeneratedMenu" icon="heroicon-o-check" color="success">
                    {{ __('ai_studio.actions.save_to_menu') }}
                </x-filament::button>
            </div>
        </x-filament::section>
    @endif

    {{-- Tab 2 footer: side-by-side translation results --}}
    @if (! empty($this->data['translate']['translations'] ?? []))
        <x-filament::section>
            <x-slot name="heading">{{ __('ai_studio.translate.results_title') }}</x-slot>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @foreach ($this->data['translate']['translations'] as $locale => $text)
                    <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
                        <div class="text-xs uppercase tracking-wider opacity-60 mb-2">
                            {{ $locale }}
                        </div>
                        <p class="text-sm whitespace-pre-wrap">
                            {{ is_string($text) ? $text : json_encode($text, JSON_UNESCAPED_UNICODE) }}
                        </p>
                    </div>
                @endforeach
            </div>
        </x-filament::section>
    @endif

    {{-- Tab 3: live test-chat panel --}}
    <x-filament::section>
        <x-slot name="heading">{{ __('ai_studio.chatbot.test_panel_title') }}</x-slot>
        <x-slot name="description">{{ __('ai_studio.chatbot.test_panel_description') }}</x-slot>

        <div class="space-y-3 mb-3 max-h-80 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
            @forelse ($this->testChat as $turn)
                <div class="flex {{ $turn['role'] === 'user' ? 'justify-end' : 'justify-start' }}">
                    <div class="max-w-[80%] rounded-2xl px-3 py-2 text-sm
                        {{ $turn['role'] === 'user'
                            ? 'bg-primary-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700' }}
                    ">
                        {{ $turn['content'] }}
                    </div>
                </div>
            @empty
                <div class="text-center text-xs opacity-60 py-6">
                    {{ __('ai_studio.chatbot.test_panel_empty') }}
                </div>
            @endforelse
        </div>

        <form wire:submit.prevent="sendTestChat" class="flex items-center gap-2">
            <input
                type="text"
                wire:model.defer="testChatInput"
                placeholder="{{ __('ai_studio.chatbot.test_panel_placeholder') }}"
                class="flex-1 rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm shadow-sm"
            />
            <x-filament::button type="submit" icon="heroicon-o-paper-airplane">
                {{ __('ai_studio.chatbot.test_panel_send') }}
            </x-filament::button>
            <x-filament::button type="button" color="gray" wire:click="resetTestChat" icon="heroicon-o-arrow-path">
                {{ __('ai_studio.chatbot.test_panel_reset') }}
            </x-filament::button>
        </form>
    </x-filament::section>

    {{-- Tab 4: Insights — top items, predicted, retire candidates --}}
    @if (! empty($insights['top_items']) || ! empty($insights['predicted']) || ! empty($insights['low_sellers']))
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <x-filament::section>
                <x-slot name="heading">{{ __('ai_studio.insights.top_items_title') }}</x-slot>
                <x-slot name="description">{{ __('ai_studio.insights.top_items_description') }}</x-slot>
                @if (! empty($insights['top_items']))
                    <ol class="space-y-1 text-sm">
                        @foreach (array_slice($insights['top_items'], 0, 10) as $i => $item)
                            <li class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 py-1">
                                <span class="truncate">{{ $i + 1 }}. {{ $item['name'] ?? '—' }}</span>
                                <span class="font-mono text-xs opacity-70">{{ $item['total_qty'] ?? 0 }}</span>
                            </li>
                        @endforeach
                    </ol>
                @else
                    <p class="text-sm opacity-60">{{ __('ai_studio.insights.no_data') }}</p>
                @endif
            </x-filament::section>

            <x-filament::section>
                <x-slot name="heading">{{ __('ai_studio.insights.predicted_title') }}</x-slot>
                <x-slot name="description">{{ __('ai_studio.insights.predicted_description') }}</x-slot>
                @if (! empty($insights['predicted']))
                    <ol class="space-y-1 text-sm">
                        @foreach (array_slice($insights['predicted'], 0, 10) as $i => $item)
                            <li class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 py-1">
                                <span class="truncate">{{ $item['name'] ?? '—' }}</span>
                                <span class="font-mono text-xs opacity-70">
                                    ~{{ $item['predicted_qty_next_week'] ?? 0 }}
                                </span>
                            </li>
                        @endforeach
                    </ol>
                @else
                    <p class="text-sm opacity-60">{{ __('ai_studio.insights.no_data') }}</p>
                @endif
            </x-filament::section>

            <x-filament::section>
                <x-slot name="heading">{{ __('ai_studio.insights.retire_title') }}</x-slot>
                <x-slot name="description">{{ __('ai_studio.insights.retire_description') }}</x-slot>
                @if (! empty($insights['low_sellers']))
                    <ol class="space-y-1 text-sm">
                        @foreach (array_slice($insights['low_sellers'], 0, 10) as $item)
                            <li class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 py-1">
                                <span class="truncate">{{ $item['name'] ?? '—' }}</span>
                                <span class="font-mono text-xs opacity-70">
                                    {{ $item['total_qty'] ?? 0 }}
                                </span>
                            </li>
                        @endforeach
                    </ol>
                @else
                    <p class="text-sm opacity-60">{{ __('ai_studio.insights.no_data') }}</p>
                @endif
            </x-filament::section>
        </div>
    @endif

    {{-- Enterprise narrative report --}}
    @if (! empty($insights['enterprise']))
        <x-filament::section>
            <x-slot name="heading">{{ __('ai_studio.insights.report_title') }}</x-slot>
            <x-slot name="description">{{ __('ai_studio.insights.report_description') }}</x-slot>

            <div class="flex items-center gap-3 mb-4">
                <x-filament::button wire:click="generateInsightsReport" icon="heroicon-o-sparkles">
                    {{ __('ai_studio.actions.generate_report') }}
                </x-filament::button>
            </div>

            @if (! empty($insights['report']))
                <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 text-sm whitespace-pre-wrap">
                    {{ $insights['report']['narrative'] ?? json_encode($insights['report'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) }}
                </div>
            @endif
        </x-filament::section>
    @endif
</x-filament-panels::page>
