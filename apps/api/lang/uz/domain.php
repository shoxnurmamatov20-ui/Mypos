<?php

declare(strict_types=1);

return [
    'nav' => [
        'label' => 'Maxsus domenlar',
    ],
    'model' => [
        'label' => 'Domen',
        'plural' => 'Domenlar',
    ],
    'col' => [
        'domain' => 'Domen',
        'tenant' => 'Restoran',
        'primary' => 'Asosiy',
        'verification' => 'Tekshiruv',
        'ssl' => 'SSL',
        'method' => 'Usul',
        'last_checked' => 'Oxirgi tekshirilgan',
        'ssl_issued' => 'SSL chiqarilgan',
        'created' => 'Yaratilgan',
    ],
    'form' => [
        'basic' => 'Asosiy',
        'verification' => 'Tekshiruv',
        'routing' => 'Yo\'naltirish',
        'domain_help' => 'To\'liq domen nomini kiriting (masalan: shop.example.uz).',
        'primary_help' => 'Faollashtirilgan bo\'lsa, bu domen birlamchi sayt manzili bo\'ladi.',
        'token' => 'Tekshiruv tokeni',
        'token_help' => 'Bu tokenni DNS yozuviga qo\'shishingiz kerak.',
        'redirects_to' => 'Qayta yo\'naltirish',
        'redirects_help' => 'Bu domen boshqa domenga yo\'naltirilsin (masalan: www.x.uz → x.uz).',
    ],
    'status' => [
        'verified' => 'Tasdiqlangan',
        'pending' => 'Kutilmoqda',
    ],
    'method' => [
        'txt' => 'TXT yozuv',
        'cname' => 'CNAME',
        'txt_full' => 'TXT yozuv (tavsiya etiladi)',
        'cname_full' => 'CNAME yozuv',
        'txt_help' => 'Eng oson yo\'l. Mavjud sayt yo\'naltirishlariga ta\'sir qilmaydi.',
        'cname_help' => 'Bu usul domeningiz to\'g\'ridan-to\'g\'ri MyPOS\'ga yo\'naltirilgan bo\'lishini talab qiladi.',
    ],
    'ssl' => [
        'pending' => 'Kutilmoqda',
        'provisioning' => 'Tayyorlanmoqda',
        'active' => 'Faol',
        'error' => 'Xatolik',
    ],
    'filter' => [
        'all' => 'Hammasi',
    ],
    'actions' => [
        'add' => 'Domen qo\'shish',
        'reverify' => 'Qayta tekshirish',
        'set_primary' => 'Asosiy sifatida tanlash',
        'verify_selected' => 'Tanlanganlarni tekshirish',
        'upgrade' => 'Plus tarifga o\'tish',
    ],
    'upgrade' => [
        'title' => 'Plus tarif kerak',
        'description' => 'Maxsus domenlar Plus va Enterprise tariflarda mavjud. Hozirgi tarif: Free.',
        'cta' => 'Tariflarni ko\'rish',
    ],
    'notifications' => [
        'reverify_started' => 'Domen qayta tekshirilmoqda',
        'verify_started_bulk' => 'Tanlangan domenlar tekshirilmoqda',
        'primary_updated' => 'Asosiy domen yangilandi',
        'verify_failed_title' => 'DNS tekshirilmadi',
    ],
    'wizard' => [
        'submit' => 'Yaratish va tekshirish',
        'step1' => [
            'title' => 'Domen kiriting',
            'description' => 'Mijozlar saytingizga qaysi manzil orqali kirishadi?',
            'help' => 'Masalan: shop.example.uz yoki menu.cafe.com',
            'method' => 'Tekshiruv usuli',
        ],
        'step2' => [
            'title' => 'DNS yozuvlari',
            'description' => 'Quyidagi yozuvlarni domen sotuvchingiz panelida qo\'shing.',
            'intro' => 'Quyidagi yozuvlarni DNS sozlamalariga qo\'shing:',
            'note' => 'DNS yangilanishi 5–60 daqiqa davom etishi mumkin.',
            'primary' => 'Asosiy domen sifatida o\'rnatish',
            'primary_help' => 'Faollashtirilgan bo\'lsa, sayt asosiy URL\'i shu domenga o\'tadi.',
        ],
        'step3' => [
            'title' => 'Tekshirish',
            'description' => 'DNS yozuvlari to\'g\'ri o\'rnatilganmi tekshiramiz.',
            'help' => '"Yaratish va tekshirish" tugmasini bosgach, biz DNS yozuvlaringizni avtomatik tekshiramiz.',
            'status' => 'Holati',
        ],
        'step4' => [
            'title' => 'SSL sertifikat',
            'description' => 'Tasdiqlangach, biz avtomatik SSL sertifikat olamiz.',
            'help' => 'Bu odatda 1–2 daqiqa davom etadi. Sahifa o\'z-o\'zidan yangilanadi.',
        ],
    ],
    'view' => [
        'basic' => 'Asosiy',
        'verification' => 'Tekshiruv',
        'ssl' => 'SSL',
        'timestamps' => 'Vaqt belgilari',
        'verified_at' => 'Tasdiqlangan vaqti',
        'updated_at' => 'Yangilangan',
        'ssl_error' => 'SSL xatosi',
    ],
];
