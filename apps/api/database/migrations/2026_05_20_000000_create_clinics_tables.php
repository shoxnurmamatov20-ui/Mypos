<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Clinic domain (port of ShifoReyting healthcare_core into MyPOS).
 *
 * Platform-level (NOT tenant-scoped) — surfaces in the CEO panel as a
 * separate vertical. bigint auto-increment IDs (intentionally NOT UUIDs)
 * to match the source data model in ShifoReyting.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinics', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('region')->nullable();
            $table->string('logo_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('clinic_departments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['clinic_id', 'name']);
        });

        Schema::create('clinic_doctors', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('department_id')->nullable()
                ->constrained('clinic_departments')->nullOnDelete();
            $table->string('name');
            $table->string('specialty')->nullable();
            $table->string('photo_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['clinic_id', 'department_id']);
        });

        Schema::create('clinic_feedback', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('department_id')->nullable()
                ->constrained('clinic_departments')->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()
                ->constrained('clinic_doctors')->nullOnDelete();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->boolean('is_verified')->default(false)->index();
            $table->unsignedTinyInteger('trust_score')->nullable();
            $table->string('sentiment')->nullable()->index();
            $table->text('comment_redacted')->nullable();
            $table->timestamp('submitted_at')->nullable()->index();
            $table->timestamps();
            $table->index(['clinic_id', 'submitted_at']);
            $table->index(['doctor_id', 'is_verified']);
        });

        Schema::create('clinic_complaints', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
            $table->foreignId('department_id')->nullable()
                ->constrained('clinic_departments')->nullOnDelete();
            $table->foreignId('doctor_id')->nullable()
                ->constrained('clinic_doctors')->nullOnDelete();
            $table->string('severity')->default('medium')->index();
            $table->string('status')->default('open')->index();
            $table->boolean('is_urgent')->default(false)->index();
            $table->text('summary')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();
            $table->index(['clinic_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_complaints');
        Schema::dropIfExists('clinic_feedback');
        Schema::dropIfExists('clinic_doctors');
        Schema::dropIfExists('clinic_departments');
        Schema::dropIfExists('clinics');
    }
};
