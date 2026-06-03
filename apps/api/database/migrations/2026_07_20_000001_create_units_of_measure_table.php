<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('units_of_measure', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');

            $table->string('name', 64);               // e.g. "Kilogramm"
            $table->string('abbreviation', 16);       // e.g. "kg"
            $table->string('type', 16);               // weight|volume|count|length
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'abbreviation']);
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'sort_order']);
        });

        Schema::table('units_of_measure', function (Blueprint $table) {
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units_of_measure');
    }
};
