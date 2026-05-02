<?php

declare(strict_types=1);

namespace App\Domain\AI\Enums;

enum AiGenerationStatus: string
{
    case Success = 'success';
    case Error = 'error';
}
