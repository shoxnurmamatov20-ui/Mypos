<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ----- warehouses -------------------------------------------------
        Schema::create('warehouses', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');

            $table->string('name', 128);
            $table->string('address', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['tenant_id', 'sort_order']);
        });

        // Add warehouse_id to ingredients (nullable for backwards compat).
        Schema::table('ingredients', function (Blueprint $table): void {
            $table->uuid('warehouse_id')->nullable()->after('category_id');
            $table->foreign('warehouse_id')
                ->references('id')
                ->on('warehouses')
                ->nullOnDelete();
            $table->index(['tenant_id', 'warehouse_id']);
        });

        // ----- incoming_documents ----------------------------------------
        Schema::create('incoming_documents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('warehouse_id');

            $table->string('doc_no', 32);
            $table->date('doc_date');
            $table->string('supplier_name', 255)->nullable();
            $table->string('supplier_inn', 32)->nullable();
            $table->bigInteger('total_amount')->default(0);
            $table->char('currency', 3)->default('UZS');
            $table->string('status', 16)->default('draft'); // draft|posted|cancelled
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('warehouse_id')
                ->references('id')
                ->on('warehouses')
                ->cascadeOnDelete();
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->unique(['tenant_id', 'doc_no'], 'incoming_doc_tenant_no_unique');
            $table->index(['tenant_id', 'doc_date'], 'incoming_doc_tenant_date_idx');
            $table->index(['tenant_id', 'status'], 'incoming_doc_tenant_status_idx');
            $table->index(['tenant_id', 'warehouse_id'], 'incoming_doc_tenant_wh_idx');
        });

        Schema::create('incoming_document_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('incoming_document_id');
            $table->uuid('ingredient_id');

            $table->decimal('quantity', 12, 3);
            $table->bigInteger('unit_price')->default(0);
            $table->bigInteger('total_price')->default(0);

            $table->date('expiry_date')->nullable();
            $table->string('batch_number', 64)->nullable();
            $table->string('notes', 255)->nullable();

            $table->timestamps();

            $table->foreign('incoming_document_id', 'inc_item_doc_fk')
                ->references('id')
                ->on('incoming_documents')
                ->cascadeOnDelete();
            $table->foreign('ingredient_id', 'inc_item_ing_fk')
                ->references('id')
                ->on('ingredients')
                ->cascadeOnDelete();

            $table->index('incoming_document_id', 'inc_item_doc_idx');
            $table->index('ingredient_id', 'inc_item_ing_idx');
        });

        // ----- waste_documents -------------------------------------------
        Schema::create('waste_documents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('warehouse_id');

            $table->string('doc_no', 32);
            $table->date('doc_date');
            $table->string('reason', 32); // expired|damaged|lost|theft|other
            $table->bigInteger('total_cost')->default(0);
            $table->string('status', 16)->default('draft'); // draft|posted
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('warehouse_id')
                ->references('id')
                ->on('warehouses')
                ->cascadeOnDelete();
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->unique(['tenant_id', 'doc_no'], 'waste_doc_tenant_no_unique');
            $table->index(['tenant_id', 'doc_date'], 'waste_doc_tenant_date_idx');
            $table->index(['tenant_id', 'status'], 'waste_doc_tenant_status_idx');
            $table->index(['tenant_id', 'warehouse_id'], 'waste_doc_tenant_wh_idx');
        });

        Schema::create('waste_document_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('waste_document_id');
            $table->uuid('ingredient_id');

            $table->decimal('quantity', 12, 3);
            $table->bigInteger('unit_cost')->default(0);
            $table->bigInteger('total_cost')->default(0);

            $table->string('notes', 255)->nullable();

            $table->timestamps();

            $table->foreign('waste_document_id', 'waste_item_doc_fk')
                ->references('id')
                ->on('waste_documents')
                ->cascadeOnDelete();
            $table->foreign('ingredient_id', 'waste_item_ing_fk')
                ->references('id')
                ->on('ingredients')
                ->cascadeOnDelete();

            $table->index('waste_document_id', 'waste_item_doc_idx');
            $table->index('ingredient_id', 'waste_item_ing_idx');
        });

        // ----- audit_sessions --------------------------------------------
        Schema::create('audit_sessions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('warehouse_id');

            $table->string('doc_no', 32);
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('conducted_by')->nullable();

            $table->string('status', 16)->default('in_progress'); // in_progress|completed|cancelled
            $table->integer('discrepancy_count')->default(0);
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('warehouse_id')
                ->references('id')
                ->on('warehouses')
                ->cascadeOnDelete();
            $table->foreign('conducted_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->unique(['tenant_id', 'doc_no'], 'audit_session_tenant_no_unique');
            $table->index(['tenant_id', 'status'], 'audit_session_tenant_status_idx');
            $table->index(['tenant_id', 'warehouse_id'], 'audit_session_tenant_wh_idx');
            $table->index(['tenant_id', 'started_at'], 'audit_session_tenant_started_idx');
        });

        Schema::create('audit_session_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('audit_session_id');
            $table->uuid('ingredient_id');

            $table->decimal('expected_quantity', 12, 3);
            $table->decimal('actual_quantity', 12, 3)->nullable();
            $table->decimal('discrepancy', 12, 3)->default(0);

            $table->string('notes', 255)->nullable();

            $table->timestamps();

            $table->foreign('audit_session_id', 'audit_item_session_fk')
                ->references('id')
                ->on('audit_sessions')
                ->cascadeOnDelete();
            $table->foreign('ingredient_id', 'audit_item_ing_fk')
                ->references('id')
                ->on('ingredients')
                ->cascadeOnDelete();

            $table->index('audit_session_id', 'audit_item_session_idx');
            $table->index('ingredient_id', 'audit_item_ing_idx');
            $table->unique(['audit_session_id', 'ingredient_id'], 'audit_item_session_ing_unique');
        });

        // ----- transfer_documents ----------------------------------------
        Schema::create('transfer_documents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('from_warehouse_id');
            $table->uuid('to_warehouse_id');

            $table->string('doc_no', 32);
            $table->date('doc_date');
            $table->string('status', 16)->default('draft'); // draft|sent|received|cancelled
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->cascadeOnDelete();
            $table->foreign('from_warehouse_id', 'transfer_from_wh_fk')
                ->references('id')
                ->on('warehouses')
                ->cascadeOnDelete();
            $table->foreign('to_warehouse_id', 'transfer_to_wh_fk')
                ->references('id')
                ->on('warehouses')
                ->cascadeOnDelete();
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->unique(['tenant_id', 'doc_no'], 'transfer_doc_tenant_no_unique');
            $table->index(['tenant_id', 'doc_date'], 'transfer_doc_tenant_date_idx');
            $table->index(['tenant_id', 'status'], 'transfer_doc_tenant_status_idx');
            $table->index(['tenant_id', 'from_warehouse_id'], 'transfer_doc_tenant_from_idx');
            $table->index(['tenant_id', 'to_warehouse_id'], 'transfer_doc_tenant_to_idx');
        });

        Schema::create('transfer_document_items', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('transfer_document_id');
            $table->uuid('ingredient_id');

            $table->decimal('quantity', 12, 3);
            $table->string('notes', 255)->nullable();

            $table->timestamps();

            $table->foreign('transfer_document_id', 'transfer_item_doc_fk')
                ->references('id')
                ->on('transfer_documents')
                ->cascadeOnDelete();
            $table->foreign('ingredient_id', 'transfer_item_ing_fk')
                ->references('id')
                ->on('ingredients')
                ->cascadeOnDelete();

            $table->index('transfer_document_id', 'transfer_item_doc_idx');
            $table->index('ingredient_id', 'transfer_item_ing_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transfer_document_items');
        Schema::dropIfExists('transfer_documents');
        Schema::dropIfExists('audit_session_items');
        Schema::dropIfExists('audit_sessions');
        Schema::dropIfExists('waste_document_items');
        Schema::dropIfExists('waste_documents');
        Schema::dropIfExists('incoming_document_items');
        Schema::dropIfExists('incoming_documents');

        if (Schema::hasColumn('ingredients', 'warehouse_id')) {
            Schema::table('ingredients', function (Blueprint $table): void {
                $table->dropForeign(['warehouse_id']);
                $table->dropIndex(['tenant_id', 'warehouse_id']);
                $table->dropColumn('warehouse_id');
            });
        }

        Schema::dropIfExists('warehouses');
    }
};
