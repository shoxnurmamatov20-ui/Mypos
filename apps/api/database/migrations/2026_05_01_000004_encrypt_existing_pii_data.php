<?php

declare(strict_types=1);

use App\Domain\Customer\Models\Customer;
use App\Domain\Notification\Models\NotificationLog;
use App\Domain\Order\Models\Order;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Re-encrypt existing PII rows after `2026_05_01_000003` widened columns and
 * the model casts started declaring `'encrypted'`.
 *
 * Strategy: for each affected table, iterate existing rows in chunks. For
 * every PII column, detect whether the stored value is *already* a Laravel
 * encryption envelope (decrypt round-trips successfully) — if so, skip;
 * otherwise treat the current value as plaintext, encrypt with `Crypt::`,
 * and persist via raw DB update (we deliberately avoid Eloquent here so the
 * cast doesn't double-encrypt the already-ciphertext value).
 *
 * Idempotency: re-running the migration is safe — every column is checked
 * individually and skipped when its value already round-trips through
 * `Crypt::decryptString`.
 */
return new class extends Migration {
    public function up(): void
    {
        $this->encryptCustomers();
        $this->encryptOrders();
        $this->encryptNotificationLogs();
    }

    public function down(): void
    {
        // No automatic decrypt. Reversing would write plaintext back to the
        // DB and is therefore opt-in only (run a one-off command if needed).
    }

    private function encryptCustomers(): void
    {
        if (! Schema::hasTable('customers')) {
            return;
        }

        DB::table('customers')->orderBy('id')->chunkById(100, function ($rows): void {
            foreach ($rows as $row) {
                $updates = [];

                $phonePlain = $this->plaintextOrNull($row->phone ?? null);
                if ($phonePlain !== null) {
                    $updates['phone'] = Crypt::encryptString($phonePlain);
                    $updates['phone_index'] = Customer::hashPhone($phonePlain);
                } elseif (
                    is_string($row->phone ?? null)
                    && $row->phone !== ''
                    && empty($row->phone_index)
                ) {
                    // Already encrypted but missing index — backfill via decrypt.
                    try {
                        $decoded = Crypt::decryptString($row->phone);
                        $updates['phone_index'] = Customer::hashPhone($decoded);
                    } catch (\Throwable $e) {
                        // can't decrypt; leave alone
                    }
                }

                $emailPlain = $this->plaintextOrNull($row->email ?? null);
                if ($emailPlain !== null) {
                    $updates['email'] = Crypt::encryptString($emailPlain);
                }

                $notesPlain = $this->plaintextOrNull($row->notes ?? null);
                if ($notesPlain !== null) {
                    $updates['notes'] = Crypt::encryptString($notesPlain);
                }

                if ($updates !== []) {
                    DB::table('customers')->where('id', $row->id)->update($updates);
                }
            }
        });
    }

    private function encryptOrders(): void
    {
        if (! Schema::hasTable('orders')) {
            return;
        }

        $hasDeliveryPhone = Schema::hasColumn('orders', 'delivery_phone');
        $hasDeliveryAddress = Schema::hasColumn('orders', 'delivery_address');
        $hasDeliveryNotes = Schema::hasColumn('orders', 'delivery_notes');
        $hasReceiptPhone = Schema::hasColumn('orders', 'customer_phone_for_receipt');

        DB::table('orders')->orderBy('id')->chunkById(100, function ($rows) use (
            $hasDeliveryPhone,
            $hasDeliveryAddress,
            $hasDeliveryNotes,
            $hasReceiptPhone,
        ): void {
            foreach ($rows as $row) {
                $updates = [];

                if ($hasDeliveryPhone) {
                    $plain = $this->plaintextOrNull($row->delivery_phone ?? null);
                    if ($plain !== null) {
                        $updates['delivery_phone'] = Crypt::encryptString($plain);
                    }
                }

                if ($hasDeliveryNotes) {
                    $plain = $this->plaintextOrNull($row->delivery_notes ?? null);
                    if ($plain !== null) {
                        $updates['delivery_notes'] = Crypt::encryptString($plain);
                    }
                }

                if ($hasReceiptPhone) {
                    $plain = $this->plaintextOrNull($row->customer_phone_for_receipt ?? null);
                    if ($plain !== null) {
                        $updates['customer_phone_for_receipt'] = Crypt::encryptString($plain);
                    }
                }

                if ($hasDeliveryAddress) {
                    $raw = $row->delivery_address ?? null;
                    if (is_string($raw) && $raw !== '' && ! $this->looksEncrypted($raw)) {
                        // Was JSONB → text after migration 003. Decode then
                        // encrypt the array (cast is `encrypted:array`).
                        $decoded = json_decode($raw, true);
                        if (is_array($decoded)) {
                            $updates['delivery_address'] = Crypt::encryptString(json_encode($decoded));
                        }
                    }
                }

                if ($updates !== []) {
                    DB::table('orders')->where('id', $row->id)->update($updates);
                }
            }
        });
    }

    private function encryptNotificationLogs(): void
    {
        if (! Schema::hasTable('notifications_log')) {
            return;
        }

        DB::table('notifications_log')->orderBy('id')->chunkById(100, function ($rows): void {
            foreach ($rows as $row) {
                $updates = [];

                $recipientPlain = $this->plaintextOrNull($row->recipient ?? null);
                if ($recipientPlain !== null) {
                    $updates['recipient'] = Crypt::encryptString($recipientPlain);
                }

                $bodyPlain = $this->plaintextOrNull($row->body ?? null);
                if ($bodyPlain !== null) {
                    $updates['body'] = Crypt::encryptString($bodyPlain);
                }

                if ($updates !== []) {
                    DB::table('notifications_log')->where('id', $row->id)->update($updates);
                }
            }
        });
    }

    /**
     * If `$value` is plaintext (not already a Laravel encryption envelope),
     * return it as a string so the caller can encrypt. Returns null when:
     *   - value is null / empty
     *   - value already round-trips through Crypt::decryptString
     */
    private function plaintextOrNull(mixed $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }
        if ($this->looksEncrypted($value)) {
            return null;
        }
        return $value;
    }

    /**
     * Detect Laravel's `Crypt::encryptString` envelope. The output is a
     * base64-encoded JSON object of the form
     * `{"iv":"...","value":"...","mac":"...","tag":""}` whose base64
     * representation deterministically begins with `eyJpdiI6` — but
     * decrypt-round-trip is the authoritative check.
     */
    private function looksEncrypted(string $value): bool
    {
        if (! str_starts_with($value, 'eyJpdiI6')) {
            return false;
        }
        try {
            Crypt::decryptString($value);
            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }
};
