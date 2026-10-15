<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sumber_data', function (Blueprint $table) {
            $table->id();
            $table->string('nama_sumber');
            $table->string('url')->nullable();
            $table->text('deskripsi')->nullable();
            $table->year('tahun_data')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sumber_data');
    }
};