<?php

declare(strict_types=1);

namespace App\Domain\AI\Enums;

/**
 * Discrete AI features billed against a tenant's daily quota.
 *
 * Stored as the string `value` in `ai_generations_log.feature` so cost
 * dashboards can group / filter without joining an enum table. Add new
 * cases here as features ship — the migration's column is varchar(64).
 */
enum AiFeature: string
{
    case MenuGenerator = 'menu_generator';
    case Translator = 'translator';
    case Description = 'description';
    case DemandForecast = 'demand_forecast';
    case Chatbot = 'chatbot';

    public function label(): string
    {
        return match ($this) {
            self::MenuGenerator => 'Menu Generator',
            self::Translator => 'Translator',
            self::Description => 'Description Writer',
            self::DemandForecast => 'Demand Forecast',
            self::Chatbot => 'Chatbot',
        };
    }
}
