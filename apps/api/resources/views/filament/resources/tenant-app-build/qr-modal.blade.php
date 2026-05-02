{{--
    QR-code modal for TestFlight / Internal Testing install links.
    Rendered by TenantAppBuildResource::rowActions()['show_qr'].
    Expects: $url — fully-qualified asset URL of the QR PNG.
--}}
@php
    /** @var string|null $url */
    $url = $url ?? null;
@endphp

<div class="flex flex-col items-center gap-4 py-2">
    @if ($url)
        <img
            src="{{ $url }}"
            alt="{{ __('app.actions.show_qr') }}"
            class="w-64 h-64 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white"
        />
        <a
            href="{{ $url }}"
            target="_blank"
            rel="noopener"
            class="text-sm text-primary-600 hover:text-primary-700 underline"
        >
            {{ __('app.actions.download_artifact') }}
        </a>
    @else
        <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ __('app.notifications.action_unavailable_body') }}
        </div>
    @endif
</div>
