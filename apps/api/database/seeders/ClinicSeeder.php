<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domain\Clinic\Models\Clinic;
use App\Domain\Clinic\Models\ClinicComplaint;
use App\Domain\Clinic\Models\ClinicDepartment;
use App\Domain\Clinic\Models\ClinicDoctor;
use App\Domain\Clinic\Models\ClinicFeedback;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Seeds 5 realistic Uzbek clinics for the CEO panel demo.
 *
 * Idempotent: re-runnable without duplicating data — only seeds children
 * the first time a given clinic is created.
 */
class ClinicSeeder extends Seeder
{
    /** @var array<int, array{name: string, region: string, address: string, phone: string}> */
    private array $clinics = [
        ['name' => 'Shifo klinika',           'region' => 'Toshkent',  'address' => 'Toshkent, Yunusobod tumani, Amir Temur shoh ko\'chasi 12', 'phone' => '+998711234567'],
        ['name' => 'Med Plus',                'region' => 'Toshkent',  'address' => 'Toshkent, Mirzo Ulug\'bek tumani, Buyuk Ipak Yo\'li 45',   'phone' => '+998712345678'],
        ['name' => 'Tabiat shifoxonasi',      'region' => 'Samarqand', 'address' => 'Samarqand, Registon ko\'chasi 7',                          'phone' => '+998662345678'],
        ['name' => 'Akfa Medline',            'region' => 'Toshkent',  'address' => 'Toshkent, Chilonzor tumani, Bunyodkor 10',                 'phone' => '+998713456789'],
        ['name' => 'Hayot tibbiyot markazi',  'region' => 'Buxoro',    'address' => 'Buxoro, Mustaqillik ko\'chasi 23',                         'phone' => '+998652345678'],
    ];

    /** @var array<int, string> */
    private array $departmentPool = [
        'Kardiologiya', 'Pediatriya', 'Stomatologiya', 'Ginekologiya', 'Nevrologiya',
        'Oftalmologiya', 'Ortopediya', 'Dermatologiya', 'Endokrinologiya',
    ];

    /** @var array<int, array{name: string, specialty: string}> */
    private array $doctorPool = [
        ['name' => 'Dr. Karim Yusupov',        'specialty' => 'Kardiolog'],
        ['name' => 'Dr. Nodira Salimova',      'specialty' => 'Pediatr'],
        ['name' => 'Dr. Bobur Rasulov',        'specialty' => 'Stomatolog'],
        ['name' => 'Dr. Malika Tursunova',     'specialty' => 'Ginekolog'],
        ['name' => 'Dr. Sherzod Akbarov',      'specialty' => 'Nevrolog'],
        ['name' => 'Dr. Olga Petrova',         'specialty' => 'Oftalmolog'],
        ['name' => 'Dr. Aziz Karimov',         'specialty' => 'Ortoped'],
        ['name' => 'Dr. Igor Smirnov',         'specialty' => 'Dermatolog'],
        ['name' => 'Dr. Nigora Toirova',       'specialty' => 'Endokrinolog'],
        ['name' => 'Dr. Jasur Toshmatov',      'specialty' => 'Kardiolog'],
        ['name' => 'Dr. Mariya Ivanova',       'specialty' => 'Pediatr'],
        ['name' => 'Dr. Sardor Yo\'ldoshev',   'specialty' => 'Nevrolog'],
    ];

    /** @var array<int, string> */
    private array $commentsPositive = [
        'Juda yaxshi xizmat, shifokorlar e\'tiborli edi.',
        'Tezkor va sifatli yordam oldim, rahmat.',
        'Doktor barcha savollarimga sabr bilan javob berdi.',
        'Tozalik va tartib a\'lo darajada.',
    ];

    /** @var array<int, string> */
    private array $commentsNeutral = [
        'Hammasi yaxshi, lekin navbat biroz uzunroq edi.',
        'Xizmat o\'rtacha, narxlar maqul.',
        'Yaxshi tajriba, lekin yaxshilanishi kerak bo\'lgan joylar bor.',
    ];

    /** @var array<int, string> */
    private array $commentsNegative = [
        'Navbat juda uzun bo\'ldi, xodimlar e\'tiborsiz edi.',
        'Tashxis xato qo\'yildi, boshqa klinikaga borishga to\'g\'ri keldi.',
    ];

    public function run(): void
    {
        foreach ($this->clinics as $row) {
            $slug = Str::slug($row['name']);

            $existing = Clinic::query()->where('slug', $slug)->first();
            if ($existing !== null) {
                continue;
            }

            $clinic = Clinic::query()->create([
                'name' => $row['name'],
                'slug' => $slug,
                'address' => $row['address'],
                'phone' => $row['phone'],
                'region' => $row['region'],
                'logo_url' => null,
                'is_active' => true,
            ]);

            $departments = $this->seedDepartments($clinic);
            $doctors = $this->seedDoctors($clinic, $departments);
            $this->seedFeedback($clinic, $departments, $doctors);
            $this->seedComplaints($clinic, $departments, $doctors);
        }

        $this->command?->info('Clinic seeder: ' . Clinic::query()->count() . ' clinics in DB.');
    }

    /**
     * @return array<int, ClinicDepartment>
     */
    private function seedDepartments(Clinic $clinic): array
    {
        $count = random_int(3, 5);
        $names = collect($this->departmentPool)->shuffle()->take($count)->all();
        $created = [];

        foreach ($names as $name) {
            $created[] = ClinicDepartment::query()->create([
                'clinic_id' => $clinic->id,
                'name' => $name,
                'is_active' => true,
            ]);
        }

        return $created;
    }

    /**
     * @param array<int, ClinicDepartment> $departments
     * @return array<int, ClinicDoctor>
     */
    private function seedDoctors(Clinic $clinic, array $departments): array
    {
        $count = random_int(4, 8);
        $created = [];

        for ($i = 0; $i < $count; $i++) {
            $tpl = $this->doctorPool[array_rand($this->doctorPool)];
            $dept = $departments[array_rand($departments)];

            $created[] = ClinicDoctor::query()->create([
                'clinic_id' => $clinic->id,
                'department_id' => $dept->id,
                'name' => $tpl['name'],
                'specialty' => $tpl['specialty'],
                'photo_url' => null,
                'is_active' => true,
            ]);
        }

        return $created;
    }

    /**
     * @param array<int, ClinicDepartment> $departments
     * @param array<int, ClinicDoctor> $doctors
     */
    private function seedFeedback(Clinic $clinic, array $departments, array $doctors): void
    {
        $count = random_int(20, 50);

        for ($i = 0; $i < $count; $i++) {
            $rating = random_int(3, 5);
            $sentiment = match (true) {
                $rating >= 5 => 'positive',
                $rating === 3 => 'neutral',
                default => random_int(0, 1) === 1 ? 'positive' : 'neutral',
            };

            $pool = match ($sentiment) {
                'positive' => $this->commentsPositive,
                'neutral' => $this->commentsNeutral,
                default => $this->commentsNegative,
            };

            $doctor = $doctors[array_rand($doctors)];

            ClinicFeedback::query()->create([
                'clinic_id' => $clinic->id,
                'department_id' => $doctor->department_id,
                'doctor_id' => $doctor->id,
                'rating' => $rating,
                'is_verified' => random_int(0, 9) < 8, // ~80% verified
                'trust_score' => random_int(70, 100),
                'sentiment' => $sentiment,
                'comment_redacted' => $pool[array_rand($pool)],
                'submitted_at' => Carbon::now()->subDays(random_int(0, 60))->subHours(random_int(0, 23)),
            ]);
        }
    }

    /**
     * @param array<int, ClinicDepartment> $departments
     * @param array<int, ClinicDoctor> $doctors
     */
    private function seedComplaints(Clinic $clinic, array $departments, array $doctors): void
    {
        $count = random_int(8, 16);

        $summaries = [
            'Navbat juda uzun edi — 3 soatdan ortiq kutdim. Xodimlar tushuntirish bermadi.',
            'Doktor mijozga e\'tibor bermadi, savollarga zo\'rg\'a javob qaytardi.',
            'Hisob-kitob noaniq qilindi, qo\'shimcha to\'lovlar tushuntirilmadi.',
            'Tibbiyot xodimi mehribon emas edi, do\'q-do\'rdir muomala qildi.',
            'Tashxis xato qo\'yildi — boshqa klinikaga borishga to\'g\'ri keldi.',
            'Kabinet juda iflos edi, sanitariya holati past darajada.',
            'Vrach kech keldi, navbat 1.5 soat kechikdi.',
            'Apparat ishlamadi, qayta yozilishimga to\'g\'ri keldi.',
            'Dori-darmonlar noto\'g\'ri buyurtirildi.',
            'Registratura xodimi qo\'pol muomala qildi.',
            'Konsultatsiya juda yuzaki edi, batafsil tushuntirilmadi.',
            'Mijozning shaxsiy ma\'lumotlari boshqalar oldida muhokama qilindi.',
        ];

        $statuses = ['open', 'open', 'open', 'in_review', 'in_review', 'resolved', 'resolved', 'escalated'];
        $severities = ['low', 'medium', 'medium', 'high', 'urgent'];

        for ($i = 0; $i < $count; $i++) {
            $doctor = $doctors[array_rand($doctors)];
            $status = $statuses[array_rand($statuses)];
            $severity = $severities[array_rand($severities)];

            $createdAgo = random_int(0, 30 * 24); // last 30 days, in hours
            $createdAt = Carbon::now()->subHours($createdAgo);

            $resolvedAt = null;
            if ($status === 'resolved') {
                $resolvedAt = $createdAt->copy()->addHours(random_int(4, 96));
                if ($resolvedAt->isFuture()) {
                    $resolvedAt = Carbon::now();
                }
            }

            ClinicComplaint::query()->create([
                'clinic_id' => $clinic->id,
                'department_id' => $doctor->department_id,
                'doctor_id' => $doctor->id,
                'severity' => $severity,
                'status' => $status,
                'is_urgent' => in_array($severity, ['high', 'urgent'], true) && $status !== 'resolved',
                'summary' => $summaries[array_rand($summaries)],
                'resolved_at' => $resolvedAt,
                'created_at' => $createdAt,
                'updated_at' => $resolvedAt ?? $createdAt,
            ]);
        }
    }
}
