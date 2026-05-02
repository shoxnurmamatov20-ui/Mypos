<?php

declare(strict_types=1);

namespace App\Domain\Tenant\Enums;

/**
 * Phase 3 — status of an App Store / Play Store *submission* (distinct from
 * the build itself). Owned by Agent D3's submission flow; defined here so
 * Agent D2's resources / DTOs can already reference the type.
 *
 * Pending  → submission row created, awaiting upload
 * Submitted → uploaded to App Store Connect / Play Console
 * InReview → reviewer assigned (Apple) or in pre-launch review (Google)
 * Approved → reviewer approved; ready for release
 * Rejected → reviewer rejected; resubmission required
 */
enum SubmissionStatus: string
{
    case Pending = 'pending';
    case Submitted = 'submitted';
    case InReview = 'in_review';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Submitted => 'Submitted',
            self::InReview => 'In review',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
        };
    }

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_map(fn (self $s): string => $s->value, self::cases());
    }
}
