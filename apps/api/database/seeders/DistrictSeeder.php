<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Shared\Models\District;
use App\Domain\Shared\Models\Region;
use Illuminate\Database\Seeder;

/**
 * Uzbekistan tumanlari/shaharlari (~180 ta).
 * Ported from ShifoReyting (2026-05-20).
 *
 * Keyed by region code. Each row: [code_suffix, type (city|district|tuman), name_uz, name_ru, name_en]
 */
class DistrictSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            // Toshkent shahri (11 ta tuman)
            'TSH' => [
                ['BEK', 'district', 'Bektemir tumani',        'Бектемирский район',       'Bektemir District'],
                ['CHL', 'district', 'Chilonzor tumani',       'Чиланзарский район',       'Chilanzar District'],
                ['MIR', 'district', 'Mirobod tumani',         'Мирабадский район',        'Mirobod District'],
                ['MZO', 'district', 'Mirzo Ulug\'bek tumani', 'Мирзо-Улугбекский район',  'Mirzo Ulugbek District'],
                ['SGZ', 'district', 'Sergeli tumani',         'Сергелийский район',       'Sergeli District'],
                ['SHK', 'district', 'Shayxontohur tumani',    'Шайхантахурский район',    'Shaykhantakhur District'],
                ['UCH', 'district', 'Uchtepa tumani',         'Учтепинский район',        'Uchtepa District'],
                ['YKS', 'district', 'Yakkasaroy tumani',      'Яккасарайский район',      'Yakkasaray District'],
                ['YSH', 'district', 'Yashnobod tumani',       'Яшнабадский район',        'Yashnobod District'],
                ['YNU', 'district', 'Yunusobod tumani',       'Юнусабадский район',       'Yunusabad District'],
                ['OLM', 'district', 'Olmazor tumani',         'Алмазарский район',        'Olmazor District'],
                ['YNG', 'district', 'Yangihayot tumani',      'Янгихаётский район',       'Yangihayot District'],
            ],

            // Toshkent viloyati
            'TOV' => [
                ['NUR', 'city',     'Nurafshon shahri',       'г. Нурафшан',              'Nurafshon City'],
                ['BEK', 'district', 'Bekobod tumani',         'Бекабадский район',        'Bekobod District'],
                ['BOS', 'district', 'Bo\'stonliq tumani',     'Бостанлыкский район',      'Bostanliq District'],
                ['BKA', 'district', 'Bo\'ka tumani',          'Букинский район',          'Buka District'],
                ['CHV', 'district', 'Chinoz tumani',          'Чиназский район',          'Chinaz District'],
                ['QBR', 'district', 'Qibray tumani',          'Кибрайский район',         'Qibray District'],
                ['OHN', 'district', 'Ohangaron tumani',       'Ахангаранский район',      'Ahangaran District'],
                ['OQQ', 'district', 'Oqqo\'rg\'on tumani',    'Аккурганский район',       'Akkurgan District'],
                ['PRK', 'district', 'Parkent tumani',         'Паркентский район',        'Parkent District'],
                ['PSK', 'district', 'Piskent tumani',         'Пскентский район',         'Piskent District'],
                ['QUY', 'district', 'Quyichirchiq tumani',    'Куйичирчикский район',     'Quyichirchiq District'],
                ['YON', 'district', 'Yangiyo\'l tumani',      'Янгиюльский район',        'Yangiyul District'],
                ['YUK', 'district', 'Yuqorichirchiq tumani',  'Верхнечирчикский район',   'Upper Chirchiq District'],
                ['ZAN', 'district', 'Zangiota tumani',        'Зангиатинский район',      'Zangiota District'],
                ['OQT', 'city',     'Olmaliq shahri',         'г. Алмалык',               'Olmaliq City'],
                ['ANG', 'city',     'Angren shahri',          'г. Ангрен',                'Angren City'],
                ['CHR', 'city',     'Chirchiq shahri',        'г. Чирчик',                'Chirchiq City'],
            ],

            // Andijon viloyati
            'AND' => [
                ['ANS', 'city',     'Andijon shahri',         'г. Андижан',               'Andijan City'],
                ['AND', 'district', 'Andijon tumani',         'Андижанский район',        'Andijan District'],
                ['ASK', 'district', 'Asaka tumani',           'Асакинский район',         'Asaka District'],
                ['BAL', 'district', 'Baliqchi tumani',        'Балыкчинский район',       'Baliqchi District'],
                ['BOZ', 'district', 'Bo\'ston tumani',        'Бустанский район',         'Boston District'],
                ['BUL', 'district', 'Buloqboshi tumani',      'Булакбашинский район',     'Bulaqboshi District'],
                ['IZB', 'district', 'Izboskan tumani',        'Избасканский район',       'Izboskan District'],
                ['JLQ', 'district', 'Jalaquduq tumani',       'Джалакудукский район',     'Jalalquduq District'],
                ['KRG', 'district', 'Qo\'rg\'ontepa tumani',  'Кургантепинский район',    'Qurgantepa District'],
                ['MRH', 'district', 'Marhamat tumani',        'Мархаматский район',       'Marhamat District'],
                ['OLT', 'district', 'Oltinko\'l tumani',      'Алтынкульский район',      'Oltinkul District'],
                ['PAX', 'district', 'Paxtaobod tumani',       'Пахтаабадский район',      'Paxtaobod District'],
                ['ULG', 'district', 'Ulug\'nor tumani',       'Улугнорский район',        'Ulugnor District'],
                ['SHK', 'district', 'Shahrixon tumani',       'Шахриханский район',       'Shahrikhan District'],
                ['XOJ', 'district', 'Xo\'jaobod tumani',      'Ходжаабадский район',      'Xojaobod District'],
            ],

            // Farg'ona viloyati
            'FAR' => [
                ['FRS', 'city',     'Farg\'ona shahri',       'г. Фергана',               'Fergana City'],
                ['QOK', 'city',     'Qo\'qon shahri',         'г. Коканд',                'Kokand City'],
                ['MRG', 'city',     'Marg\'ilon shahri',      'г. Маргилан',              'Margilan City'],
                ['KVS', 'city',     'Quvasoy shahri',         'г. Кувасай',               'Quvasoy City'],
                ['OLT', 'district', 'Oltiariq tumani',        'Алтыарыкский район',       'Oltiariq District'],
                ['BAG', 'district', 'Bog\'dod tumani',        'Багдадский район',         'Bogdod District'],
                ['BUV', 'district', 'Buvayda tumani',         'Бувайдинский район',       'Buvayda District'],
                ['DNG', 'district', 'Dang\'ara tumani',       'Дангаринский район',       'Dangara District'],
                ['FRG', 'district', 'Farg\'ona tumani',       'Ферганский район',         'Fergana District'],
                ['FUR', 'district', 'Furqat tumani',          'Фуркатский район',         'Furqat District'],
                ['QSH', 'district', 'Qo\'shtepa tumani',      'Куштепинский район',       'Qushtepa District'],
                ['QUV', 'district', 'Quva tumani',            'Кувинский район',          'Quva District'],
                ['RSH', 'district', 'Rishton tumani',         'Риштанский район',         'Rishton District'],
                ['SOX', 'district', 'So\'x tumani',           'Сохский район',            'Sokh District'],
                ['TSH', 'district', 'Toshloq tumani',         'Ташлакский район',         'Toshloq District'],
                ['UCH', 'district', 'Uchko\'prik tumani',     'Учкуприкский район',       'Uchkuprik District'],
                ['YOZ', 'district', 'Yozyovon tumani',        'Язъяванский район',        'Yozyovon District'],
                ['OZB', 'district', "O'zbekiston tumani",     'Узбекистанский район',     'Uzbekistan District'],
            ],

            // Namangan viloyati
            'NAM' => [
                ['NMS', 'city',     'Namangan shahri',        'г. Наманган',              'Namangan City'],
                ['CHR', 'district', 'Chortoq tumani',         'Чартакский район',         'Chartaq District'],
                ['CHS', 'district', 'Chust tumani',           'Чустский район',           'Chust District'],
                ['KSN', 'district', 'Kosonsoy tumani',        'Касансайский район',       'Kasansay District'],
                ['MNG', 'district', 'Mingbuloq tumani',       'Мингбулакский район',      'Mingbulaq District'],
                ['NAM', 'district', 'Namangan tumani',        'Наманганский район',       'Namangan District'],
                ['NRN', 'district', 'Norin tumani',           'Нарынский район',          'Norin District'],
                ['PAP', 'district', 'Pop tumani',             'Папский район',            'Pap District'],
                ['TRG', 'district', 'To\'raqo\'rg\'on tumani','Туракурганский район',     'Turaqorgan District'],
                ['UYC', 'district', 'Uychi tumani',           'Уйчинский район',          'Uychi District'],
                ['UCK', 'district', 'Uchqo\'rg\'on tumani',   'Учкурганский район',       'Uchqorgan District'],
                ['YAN', 'district', 'Yangiqo\'rg\'on tumani', 'Янгикурганский район',     'Yangiqorgan District'],
            ],

            // Samarqand viloyati
            'SAM' => [
                ['SMS', 'city',     'Samarqand shahri',       'г. Самарканд',             'Samarkand City'],
                ['KTK', 'city',     'Kattaqo\'rg\'on shahri', 'г. Каттакурган',           'Kattakurgan City'],
                ['BLG', 'district', 'Bulung\'ur tumani',      'Булунгурский район',       'Bulungur District'],
                ['ISH', 'district', 'Ishtixon tumani',        'Иштыханский район',        'Ishtixon District'],
                ['JAM', 'district', 'Jomboy tumani',          'Джамбайский район',        'Jomboy District'],
                ['KAT', 'district', 'Kattaqo\'rg\'on tumani', 'Каттакурганский район',    'Kattakurgan District'],
                ['NRP', 'district', 'Narpay tumani',          'Нарпайский район',         'Narpay District'],
                ['NUR', 'district', 'Nurobod tumani',         'Нурабадский район',        'Nurobod District'],
                ['OQD', 'district', 'Oqdaryo tumani',         'Акдарьинский район',       'Oqdaryo District'],
                ['PAS', 'district', 'Pastdarg\'om tumani',    'Пастдаргомский район',     'Pastdargom District'],
                ['PAX', 'district', 'Paxtachi tumani',        'Пахтачинский район',       'Paxtachi District'],
                ['PYR', 'district', 'Payariq tumani',         'Пайарыкский район',        'Payariq District'],
                ['QSH', 'district', 'Qo\'shrabot tumani',     'Кушрабадский район',       'Qushrabot District'],
                ['SAM', 'district', 'Samarqand tumani',       'Самаркандский район',      'Samarkand District'],
                ['TOY', 'district', 'Toyloq tumani',          'Тайлакский район',         'Toyloq District'],
                ['URG', 'district', 'Urgut tumani',           'Ургутский район',          'Urgut District'],
            ],

            // Buxoro viloyati
            'BUX' => [
                ['BXS', 'city',     'Buxoro shahri',          'г. Бухара',                'Bukhara City'],
                ['KAG', 'city',     'Kogon shahri',           'г. Каган',                 'Kagan City'],
                ['OLT', 'district', 'Olot tumani',            'Алатский район',           'Olot District'],
                ['BUX', 'district', 'Buxoro tumani',          'Бухарский район',          'Bukhara District'],
                ['GIJ', 'district', 'G\'ijduvon tumani',      'Гиждуванский район',       'Gijduvan District'],
                ['JON', 'district', 'Jondor tumani',          'Жандорский район',         'Jondor District'],
                ['KGN', 'district', 'Kogon tumani',           'Каганский район',          'Kagan District'],
                ['KRK', 'district', 'Karakul tumani',         'Каракульский район',       'Karakul District'],
                ['PEY', 'district', 'Peshku tumani',          'Пешкунский район',         'Peshku District'],
                ['QRO', 'district', 'Qorako\'l tumani',       'Каракульский район',       'Qorakol District'],
                ['QRV', 'district', 'Qorovulbozor tumani',    'Караулбазарский район',    'Qorovulbozor District'],
                ['ROM', 'district', 'Romitan tumani',         'Ромитанский район',        'Romitan District'],
                ['SHF', 'district', 'Shofirkon tumani',       'Шафирканский район',       'Shafirkan District'],
                ['VOB', 'district', 'Vobkent tumani',         'Вабкентский район',        'Vobkent District'],
            ],

            // Xorazm viloyati
            'XOR' => [
                ['URG', 'city',     'Urganch shahri',         'г. Ургенч',                'Urgench City'],
                ['XIV', 'city',     'Xiva shahri',            'г. Хива',                  'Khiva City'],
                ['BOG', 'district', 'Bog\'ot tumani',         'Багатский район',          'Bogot District'],
                ['GUR', 'district', 'Gurlan tumani',          'Гурленский район',         'Gurlan District'],
                ['XNQ', 'district', 'Xonqa tumani',           'Ханкинский район',         'Xonqa District'],
                ['XZR', 'district', 'Hazorasp tumani',        'Хазараспский район',       'Hazorasp District'],
                ['SHO', 'district', 'Shovot tumani',          'Шаватский район',          'Shovot District'],
                ['URT', 'district', 'Urganch tumani',         'Ургенчский район',         'Urgench District'],
                ['QOS', 'district', 'Qo\'shko\'pir tumani',   'Кошкупырский район',       'Qoshkopir District'],
                ['YNG', 'district', 'Yangiariq tumani',       'Янгиарыкский район',       'Yangiariq District'],
                ['YNB', 'district', 'Yangibozor tumani',      'Янгибазарский район',      'Yangibozor District'],
                ['TUP', 'district', 'Tuproqqal\'a tumani',    'Тупроккалинский район',    'Tuproqqala District'],
            ],

            // Qashqadaryo viloyati
            'QAS' => [
                ['QRS', 'city',     'Qarshi shahri',          'г. Карши',                 'Qarshi City'],
                ['SHS', 'city',     'Shahrisabz shahri',      'г. Шахрисабз',             'Shahrisabz City'],
                ['DEH', 'district', 'Dehqonobod tumani',      'Дехканабадский район',     'Dehqonobod District'],
                ['GUZ', 'district', 'G\'uzor tumani',         'Гузарский район',          'Guzar District'],
                ['KSB', 'district', 'Kasbi tumani',           'Касбинский район',         'Kasbi District'],
                ['KTQ', 'district', 'Kitob tumani',           'Китабский район',          'Kitob District'],
                ['KSN', 'district', 'Koson tumani',           'Касанский район',          'Koson District'],
                ['MUB', 'district', 'Muborak tumani',         'Мубарекский район',        'Muborak District'],
                ['MIR', 'district', 'Mirishkor tumani',       'Миришкорский район',       'Mirishkor District'],
                ['NSB', 'district', 'Nishon tumani',          'Нишанский район',          'Nishon District'],
                ['QMY', 'district', 'Qamashi tumani',         'Камашинский район',        'Qamashi District'],
                ['QRD', 'district', 'Qarshi tumani',          'Каршинский район',         'Qarshi District'],
                ['SHH', 'district', 'Shahrisabz tumani',      'Шахрисабзский район',      'Shahrisabz District'],
                ['CHR', 'district', 'Chiroqchi tumani',       'Чиракчинский район',       'Chiroqchi District'],
                ['YAK', 'district', 'Yakkabog\' tumani',      'Яккабагский район',        'Yakkabog District'],
            ],

            // Surxondaryo viloyati
            'SUR' => [
                ['TRM', 'city',     'Termiz shahri',          'г. Термез',                'Termez City'],
                ['ANQ', 'district', 'Angor tumani',           'Ангорский район',          'Angor District'],
                ['BDN', 'district', 'Boysun tumani',          'Байсунский район',         'Boysun District'],
                ['BND', 'district', 'Bandixon tumani',        'Бандыханский район',       'Bandixon District'],
                ['DNG', 'district', 'Denov tumani',           'Денауский район',          'Denov District'],
                ['JRQ', 'district', 'Jarqo\'rg\'on tumani',   'Джаркурганский район',     'Jarqorgan District'],
                ['MZR', 'district', 'Muzrabot tumani',        'Музрабатский район',       'Muzrabot District'],
                ['OLT', 'district', 'Oltinsoy tumani',        'Алтынсайский район',       'Oltinsoy District'],
                ['QIZ', 'district', 'Qiziriq tumani',         'Кизирикский район',        'Qiziriq District'],
                ['QMQ', 'district', 'Qumqo\'rg\'on tumani',   'Кумкурганский район',      'Qumqorgan District'],
                ['SRA', 'district', 'Sariosiyo tumani',       'Сариасийский район',       'Sariosiyo District'],
                ['SHR', 'district', 'Sherobod tumani',        'Шерабадский район',        'Sherobod District'],
                ['SHG', 'district', 'Sho\'rchi tumani',       'Шурчинский район',         'Shorchi District'],
                ['TRD', 'district', 'Termiz tumani',          'Термезский район',         'Termez District'],
                ['UZN', 'district', 'Uzun tumani',            'Узунский район',           'Uzun District'],
            ],

            // Navoiy viloyati
            'NAV' => [
                ['NVS', 'city',     'Navoiy shahri',          'г. Навои',                 'Navoi City'],
                ['ZRF', 'city',     'Zarafshon shahri',       'г. Зарафшан',              'Zarafshon City'],
                ['KGT', 'district', 'Karmana tumani',         'Карманинский район',       'Karmana District'],
                ['KZL', 'district', 'Qiziltepa tumani',       'Кызылтепинский район',     'Qiziltepa District'],
                ['KNM', 'district', 'Konimex tumani',         'Канимехский район',        'Konimex District'],
                ['NRT', 'district', 'Nurota tumani',          'Нуратинский район',        'Nurota District'],
                ['TMY', 'district', 'Tomdi tumani',           'Тамдынский район',         'Tomdi District'],
                ['UCH', 'district', 'Uchquduq tumani',        'Учкудукский район',        'Uchquduq District'],
                ['XTR', 'district', 'Xatirchi tumani',        'Хатырчинский район',       'Xatirchi District'],
                ['NVB', 'district', 'Navbahor tumani',        'Навбахорский район',       'Navbahor District'],
            ],

            // Jizzax viloyati
            'JIZ' => [
                ['JZS', 'city',     'Jizzax shahri',          'г. Джизак',                'Jizzakh City'],
                ['ARA', 'district', 'Arnasoy tumani',         'Арнасайский район',        'Arnasay District'],
                ['BAH', 'district', 'Baxmal tumani',          'Бахмальский район',        'Bakhmal District'],
                ['DOS', 'district', 'Do\'stlik tumani',       'Дустликский район',        'Dostlik District'],
                ['FRS', 'district', 'Forish tumani',          'Фаришский район',          'Forish District'],
                ['GAL', 'district', "G'allaorol tumani",      'Галляаральский район',     'Gallaorol District'],
                ['JIZ', 'district', 'Jizzax tumani',          'Джизакский район',         'Jizzakh District'],
                ['MIR', 'district', 'Mirzacho\'l tumani',     'Мирзачульский район',      'Mirzachol District'],
                ['PAX', 'district', 'Paxtakor tumani',        'Пахтакорский район',       'Paxtakor District'],
                ['ZAM', 'district', 'Zomin tumani',           'Заминский район',          'Zomin District'],
                ['ZAR', 'district', 'Zarbdor tumani',         'Зарбдарский район',        'Zarbdor District'],
                ['YNG', 'district', 'Yangiobod tumani',       'Янгиабадский район',       'Yangiobod District'],
                ['ZAF', 'district', 'Zafarobod tumani',       'Зафарабадский район',      'Zafarobod District'],
            ],

            // Sirdaryo viloyati
            'SIR' => [
                ['GLS', 'city',     'Guliston shahri',        'г. Гулистан',              'Gulistan City'],
                ['YNG', 'city',     'Yangiyer shahri',        'г. Янгиер',                'Yangiyer City'],
                ['SRD', 'district', 'Sirdaryo tumani',        'Сырдарьинский район',      'Sirdaryo District'],
                ['MRZ', 'district', 'Mirzaobod tumani',       'Мирзаабадский район',      'Mirzaobod District'],
                ['BOY', 'district', 'Boyovut tumani',         'Баяутский район',          'Boyovut District'],
                ['GUL', 'district', 'Guliston tumani',        'Гулистанский район',       'Gulistan District'],
                ['XVO', 'district', 'Xovos tumani',           'Хавастский район',         'Xovos District'],
                ['OQY', 'district', 'Oqoltin tumani',         'Акалтынский район',        'Oqoltin District'],
                ['SAY', 'district', 'Sayxunobod tumani',      'Сайхунабадский район',     'Sayxunobod District'],
                ['SRT', 'district', 'Sardoba tumani',         'Сардобинский район',       'Sardoba District'],
            ],

            // Qoraqalpog'iston Respublikasi
            'QRK' => [
                ['NKS', 'city',     'Nukus shahri',           'г. Нукус',                 'Nukus City'],
                ['AMU', 'district', 'Amudaryo tumani',        'Амударьинский район',      'Amudarya District'],
                ['BRN', 'district', 'Beruniy tumani',         'Берунийский район',        'Beruni District'],
                ['CHM', 'district', 'Chimboy tumani',         'Чимбайский район',         'Chimboy District'],
                ['ELQ', 'district', 'Ellikqal\'a tumani',     'Элликкалинский район',     'Ellikqala District'],
                ['KGY', 'district', 'Kegeyli tumani',         'Кегейлийский район',       'Kegeyli District'],
                ['QGR', 'district', 'Qanliko\'l tumani',      'Канлыкульский район',      'Qanlikul District'],
                ['QRZ', 'district', 'Qoraqalpog\'iston',      'Каракалпакский район',     'Qoraqalpak District'],
                ['QGT', 'district', 'Qo\'ng\'irot tumani',    'Кунградский район',        'Qongirot District'],
                ['QRT', 'district', 'Qorao\'zak tumani',      'Караузякский район',       'Qorao\'zak District'],
                ['MYN', 'district', 'Mo\'ynoq tumani',        'Муйнакский район',         'Muynak District'],
                ['NKR', 'district', 'Nukus tumani',           'Нукусский район',          'Nukus District'],
                ['SHM', 'district', 'Shumanay tumani',        'Шуманайский район',        'Shumanay District'],
                ['TAH', 'district', 'Taxtako\'pir tumani',    'Тахтакупырский район',     'Taxtakupir District'],
                ['TRK', 'district', 'To\'rtko\'l tumani',     'Турткульский район',       'Turtkul District'],
                ['XOJ', 'district', 'Xo\'jayli tumani',       'Ходжейлийский район',      'Xojayli District'],
                ['BOZ', 'district', 'Bozatau tumani',         'Бозатауский район',        'Bozatau District'],
            ],
        ];

        $regions = Region::pluck('id', 'code');

        $createdCount = 0;
        foreach ($data as $regionCode => $rows) {
            $regionId = $regions[$regionCode] ?? null;
            if (! $regionId) {
                continue;
            }
            foreach ($rows as [$suffix, $type, $nameUz, $nameRu, $nameEn]) {
                $code = $regionCode.'-'.$suffix;
                District::updateOrCreate(
                    ['code' => $code],
                    [
                        'region_id' => $regionId,
                        'name_uz'   => $nameUz,
                        'name_ru'   => $nameRu,
                        'name_en'   => $nameEn,
                        'type'      => $type,
                        'is_active' => true,
                    ],
                );
                $createdCount++;
            }
        }

        $this->command?->info(sprintf('Districts seeded: %d across %d regions', $createdCount, $regions->count()));
    }
}
