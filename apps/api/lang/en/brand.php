<?php

declare(strict_types=1);

return [
    'nav' => [
        'label' => 'Brand Studio',
    ],
    'page' => [
        'title' => 'Brand Studio',
    ],
    'theme' => [
        'title' => 'Theme',
        'description' => 'Choose the overall visual style for your restaurant.',
        'label' => 'Theme',
        'modern' => 'Modern',
        'classic' => 'Classic',
        'minimal' => 'Minimal',
        'premium' => 'Premium',
    ],
    'logos' => [
        'title' => 'Logos & images',
        'description' => 'Upload your logo, favicon, and hero imagery.',
        'logo' => 'Logo',
        'logo_dark' => 'Logo (dark mode)',
        'logo_dark_help' => 'Optional variant used on dark backgrounds.',
        'favicon' => 'Favicon',
        'favicon_help' => 'Square icon used in the browser tab (32×32 or 64×64).',
        'cover' => 'Social cover',
        'hero' => 'Hero image',
        'og' => 'Link share image (OG)',
        'og_help' => 'Shown when your link is shared on Telegram, WhatsApp, etc. (1200×630).',
    ],
    'colors' => [
        'title' => 'Colors',
        'description' => 'Your brand’s primary palette.',
        'primary' => 'Primary',
        'accent' => 'Accent',
        'text' => 'Text',
        'background' => 'Background',
    ],
    'typography' => [
        'title' => 'Typography',
        'font_family' => 'Body font',
        'font_heading' => 'Heading font',
        'font_heading_help' => 'If empty, the body font is used for headings as well.',
    ],
    'hero' => [
        'title' => 'Hero copy',
        'description' => 'Text shown to guests on the home page — provided in three languages.',
        'heading' => 'Heading',
        'subheading' => 'Subheading',
        'tagline' => 'Tagline',
    ],
    'custom_css' => [
        'title' => 'Custom CSS',
        'description' => 'Plus tier: add your own custom CSS.',
        'upgrade_required' => 'Custom CSS is only available on the Plus and Enterprise tiers.',
        'label' => 'Custom CSS',
        'helper' => 'Use at your own risk. CSS is sanitised and length-capped for safety.',
    ],
    'social' => [
        'title' => 'Social',
    ],
    'tenant_selector' => [
        'label' => 'Select tenant',
        'placeholder' => 'Pick a tenant…',
        'help' => 'As super admin, you can edit any tenant’s brand.',
    ],
    'actions' => [
        'save' => 'Save',
        'open_preview' => 'Open preview',
    ],
    'saved' => [
        'title' => 'Brand saved',
        'body' => 'Changes will appear on the storefront and apps within a minute.',
    ],
    'error' => [
        'title' => 'Save failed',
    ],
    'preview' => [
        'title' => 'Live preview',
        'description' => 'Updates as you change the form.',
        'sample_brand' => 'My Restaurant',
        'sample_hero_title' => 'Best food in town',
        'sample_hero_subtitle' => 'New dishes every week for our guests',
        'menu_sample_1' => 'Fried chicken',
        'menu_sample_2' => 'Tea',
        'menu_sample_3' => 'Steak',
        'currency' => 'UZS',
        'cta' => 'Order now',
        'note' => 'This is just a preview — the live storefront has more sections.',
        'swatches' => 'Palette',
    ],
];
