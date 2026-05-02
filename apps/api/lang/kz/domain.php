<?php

declare(strict_types=1);

return [
    'nav' => [
        'label' => 'Жеке домендер',
    ],
    'model' => [
        'label' => 'Домен',
        'plural' => 'Домендер',
    ],
    'col' => [
        'domain' => 'Домен',
        'tenant' => 'Мейрамхана',
        'primary' => 'Негізгі',
        'verification' => 'Тексеру',
        'ssl' => 'SSL',
        'method' => 'Әдіс',
        'last_checked' => 'Соңғы тексеру',
        'ssl_issued' => 'SSL берілді',
        'created' => 'Жасалды',
    ],
    'form' => [
        'basic' => 'Негізгі',
        'verification' => 'Тексеру',
        'routing' => 'Бағыттау',
        'domain_help' => 'Толық домен атауын енгізіңіз (мысалы, shop.example.uz).',
        'primary_help' => 'Қосылса — бұл домен негізгі URL болады.',
        'token' => 'Тексеру токені',
        'token_help' => 'Бұл токенді DNS-жазбаға қосу қажет.',
        'redirects_to' => 'Бағыттау',
        'redirects_help' => 'Доменді басқа доменге бағыттау (мысалы, www.x.uz → x.uz).',
    ],
    'status' => [
        'verified' => 'Тексерілді',
        'pending' => 'Күтуде',
    ],
    'method' => [
        'txt' => 'TXT-жазба',
        'cname' => 'CNAME',
        'txt_full' => 'TXT-жазба (ұсынылады)',
        'cname_full' => 'CNAME',
        'txt_help' => 'Ең қарапайым жол. Қазіргі сайт бағытталуына әсер етпейді.',
        'cname_help' => 'Доменді тікелей MyPOS прокси арқылы бағыттайды.',
    ],
    'ssl' => [
        'pending' => 'Күтуде',
        'provisioning' => 'Шығарылуда',
        'active' => 'Белсенді',
        'error' => 'Қате',
    ],
    'filter' => [
        'all' => 'Барлығы',
    ],
    'actions' => [
        'add' => 'Домен қосу',
        'reverify' => 'Қайта тексеру',
        'set_primary' => 'Негізгі ету',
        'verify_selected' => 'Таңдалғандарды тексеру',
        'upgrade' => 'Plus-қа өту',
    ],
    'upgrade' => [
        'title' => 'Plus тарифі қажет',
        'description' => 'Жеке домендер Plus және Enterprise тарифтерінде қолжетімді. Ағымдағы тариф: Free.',
        'cta' => 'Тарифтерді қарау',
    ],
    'notifications' => [
        'reverify_started' => 'Қайта тексеру іске қосылды',
        'verify_started_bulk' => 'Таңдалған домендер үшін қайта тексеру іске қосылды',
        'primary_updated' => 'Негізгі домен жаңартылды',
        'verify_failed_title' => 'DNS тексеру қатесі',
    ],
    'wizard' => [
        'submit' => 'Жасап, тексеру',
        'step1' => [
            'title' => 'Доменді енгізіңіз',
            'description' => 'Клиенттер сайтыңызды қандай мекенжайда көреді?',
            'help' => 'Мысалы: shop.example.uz немесе menu.cafe.com',
            'method' => 'Тексеру әдісі',
        ],
        'step2' => [
            'title' => 'DNS-жазбалар',
            'description' => 'Төмендегі жазбаларды DNS-провайдер панеліне қосыңыз.',
            'intro' => 'Келесі жазбаларды DNS-ке қосыңыз:',
            'note' => 'DNS тарату 5–60 минут алуы мүмкін.',
            'primary' => 'Негізгі ету',
            'primary_help' => 'Қосылса — сайт негізгі URL осы доменге ауысады.',
        ],
        'step3' => [
            'title' => 'Тексеру',
            'description' => 'DNS-жазбалардың дұрыстығын тексереміз.',
            'help' => 'Жіберген кезде DNS тексеруді автоматты түрде іске қосамыз.',
            'status' => 'Күйі',
        ],
        'step4' => [
            'title' => 'SSL-сертификат',
            'description' => 'Тексергеннен кейін SSL-сертификатты автоматты шығарамыз.',
            'help' => 'Әдетте 1–2 минут алады. Бет автоматты түрде жаңартылады.',
        ],
    ],
    'view' => [
        'basic' => 'Негізгі',
        'verification' => 'Тексеру',
        'ssl' => 'SSL',
        'timestamps' => 'Уақыт белгілері',
        'verified_at' => 'Тексерілген уақыт',
        'updated_at' => 'Жаңартылды',
        'ssl_error' => 'SSL қатесі',
    ],
];
