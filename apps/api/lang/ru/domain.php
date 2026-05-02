<?php

declare(strict_types=1);

return [
    'nav' => [
        'label' => 'Свои домены',
    ],
    'model' => [
        'label' => 'Домен',
        'plural' => 'Домены',
    ],
    'col' => [
        'domain' => 'Домен',
        'tenant' => 'Ресторан',
        'primary' => 'Основной',
        'verification' => 'Проверка',
        'ssl' => 'SSL',
        'method' => 'Метод',
        'last_checked' => 'Последняя проверка',
        'ssl_issued' => 'SSL выпущен',
        'created' => 'Создан',
    ],
    'form' => [
        'basic' => 'Основное',
        'verification' => 'Проверка',
        'routing' => 'Маршрутизация',
        'domain_help' => 'Введите полное доменное имя (например, shop.example.uz).',
        'primary_help' => 'Если включено — этот домен становится основным URL.',
        'token' => 'Токен проверки',
        'token_help' => 'Этот токен нужно добавить в DNS-запись.',
        'redirects_to' => 'Редирект на',
        'redirects_help' => 'Перенаправлять домен на другой (например, www.x.uz → x.uz).',
    ],
    'status' => [
        'verified' => 'Проверен',
        'pending' => 'Ожидает',
    ],
    'method' => [
        'txt' => 'TXT-запись',
        'cname' => 'CNAME',
        'txt_full' => 'TXT-запись (рекомендуется)',
        'cname_full' => 'CNAME',
        'txt_help' => 'Самый простой путь. Не влияет на текущую маршрутизацию сайта.',
        'cname_help' => 'Направляет домен напрямую через прокси MyPOS.',
    ],
    'ssl' => [
        'pending' => 'Ожидает',
        'provisioning' => 'Выпускается',
        'active' => 'Активен',
        'error' => 'Ошибка',
    ],
    'filter' => [
        'all' => 'Все',
    ],
    'actions' => [
        'add' => 'Добавить домен',
        'reverify' => 'Перепроверить',
        'set_primary' => 'Сделать основным',
        'verify_selected' => 'Проверить выбранные',
        'upgrade' => 'Перейти на Plus',
    ],
    'upgrade' => [
        'title' => 'Нужен тариф Plus',
        'description' => 'Свои домены доступны на тарифах Plus и Enterprise. Текущий тариф: Free.',
        'cta' => 'Посмотреть тарифы',
    ],
    'notifications' => [
        'reverify_started' => 'Перепроверка запущена',
        'verify_started_bulk' => 'Перепроверка запущена для выбранных доменов',
        'primary_updated' => 'Основной домен обновлён',
        'verify_failed_title' => 'Ошибка проверки DNS',
    ],
    'wizard' => [
        'submit' => 'Создать и проверить',
        'step1' => [
            'title' => 'Введите домен',
            'description' => 'По какому адресу клиенты будут видеть ваш сайт?',
            'help' => 'Например: shop.example.uz или menu.cafe.com',
            'method' => 'Метод проверки',
        ],
        'step2' => [
            'title' => 'DNS-записи',
            'description' => 'Добавьте записи ниже в панели вашего DNS-провайдера.',
            'intro' => 'Добавьте следующие записи в DNS:',
            'note' => 'Распространение DNS может занять 5–60 минут.',
            'primary' => 'Сделать основным',
            'primary_help' => 'Если включено — основной URL сайта переключится на этот домен.',
        ],
        'step3' => [
            'title' => 'Проверка',
            'description' => 'Мы проверим корректность DNS-записей.',
            'help' => 'При отправке мы автоматически запустим проверку DNS.',
            'status' => 'Статус',
        ],
        'step4' => [
            'title' => 'SSL-сертификат',
            'description' => 'После проверки мы автоматически выпустим SSL-сертификат.',
            'help' => 'Обычно занимает 1–2 минуты. Страница обновится автоматически.',
        ],
    ],
    'view' => [
        'basic' => 'Основное',
        'verification' => 'Проверка',
        'ssl' => 'SSL',
        'timestamps' => 'Метки времени',
        'verified_at' => 'Время проверки',
        'updated_at' => 'Обновлён',
        'ssl_error' => 'Ошибка SSL',
    ],
];
