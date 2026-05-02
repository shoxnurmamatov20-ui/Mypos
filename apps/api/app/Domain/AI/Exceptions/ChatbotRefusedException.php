<?php

declare(strict_types=1);

namespace App\Domain\AI\Exceptions;

use RuntimeException;

/**
 * Phase-4 — thrown by {@see \App\Domain\AI\Services\ChatbotService} when
 * {@see \App\Domain\AI\Services\ChatSafetyFilter} rejects the user message
 * (profanity, prompt injection, empty input).
 *
 * Carries both a machine-friendly `reason` code (used for analytics) and a
 * pre-localised `userMessage` the controller renders in `data.reply` —
 * we still respond with HTTP 200 because, from the customer's POV, the
 * chatbot answered ("sorry, I can't respond to that").
 */
final class ChatbotRefusedException extends RuntimeException
{
    public function __construct(
        public readonly string $reason,
        public readonly string $userMessage,
    ) {
        parent::__construct('chatbot refused: ' . $reason);
    }
}
