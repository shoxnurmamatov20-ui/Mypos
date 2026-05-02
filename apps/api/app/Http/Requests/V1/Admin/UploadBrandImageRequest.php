<?php

declare(strict_types=1);

namespace App\Http\Requests\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * POST /api/v1/admin/brand/{logo|cover|hero|favicon} — multipart upload.
 *
 * The same FormRequest is reused for every image slot; per-slot dimension
 * limits live in the action (favicons must be small + square, heroes may
 * be very large). Here we only enforce universal constraints:
 *
 *   - mimetype is image/* and recognized by Laravel's image validator
 *   - size ≤ 2 MB (raises a 422 with i18n message)
 *
 * Field name conventions:
 *   - The endpoint expects either `logo` (slot-named — common in tests) or
 *     `image` (generic). The controller resolves whichever is sent so dashboard
 *     SDKs aren't forced to keep a slot→field map.
 */
class UploadBrandImageRequest extends FormRequest
{
    public const MAX_SIZE_KB = 2048; // 2 MB

    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->tenant_id !== null;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        $imageRules = [
            'required_without_all:image',
            'file',
            'image',
            // SVG dropped — embedded `<script>` / `onload` makes SVG a stored
            // XSS vector when served from the same eTLD as the API. Use raster
            // formats only. Polyglot defense added separately (re-encode via
            // Intervention before storage).
            'mimes:jpg,jpeg,png,webp,gif',
            'max:' . self::MAX_SIZE_KB,
        ];
        $imageRulesAlt = [
            'required_without_all:logo',
            'file',
            'image',
            // SVG dropped — embedded `<script>` / `onload` makes SVG a stored
            // XSS vector when served from the same eTLD as the API. Use raster
            // formats only. Polyglot defense added separately (re-encode via
            // Intervention before storage).
            'mimes:jpg,jpeg,png,webp,gif',
            'max:' . self::MAX_SIZE_KB,
        ];

        return [
            'logo' => $imageRules,
            'image' => $imageRulesAlt,
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'logo.required_without_all' => __('Rasm fayli yuborilmadi'),
            'logo.image' => __('Yuborilgan fayl rasm emas'),
            'logo.mimes' => __('Rasm jpg, png, webp yoki gif formatida bo\'lishi kerak'),
            'logo.max' => __('Rasm hajmi :max KB dan oshmasligi kerak', ['max' => self::MAX_SIZE_KB]),
            'image.required_without_all' => __('Rasm fayli yuborilmadi'),
            'image.image' => __('Yuborilgan fayl rasm emas'),
            'image.mimes' => __('Rasm jpg, png, webp yoki gif formatida bo\'lishi kerak'),
            'image.max' => __('Rasm hajmi :max KB dan oshmasligi kerak', ['max' => self::MAX_SIZE_KB]),
        ];
    }

    /**
     * Resolve whichever field carries the upload — both `logo` and `image`
     * are accepted. Returns `null` if validation lets a request through with
     * neither (impossible given `required_without_all`, but kept defensive).
     */
    public function uploadedFile(): ?\Illuminate\Http\UploadedFile
    {
        if ($this->hasFile('logo')) {
            return $this->file('logo');
        }
        if ($this->hasFile('image')) {
            return $this->file('image');
        }
        return null;
    }
}
