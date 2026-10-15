<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indeks_urgensi', function (Blueprint $table) {
            $table->id();
            $table->char('kode_desa', 10)->unique();
            $table->float('skor_komposit');
            $table->smallInteger('kelas_urgensi');  // 1-5
            $table->string('label_urgensi');        // Aman, Ringan, Sedang, Urgent, Sangat Urgent
            $table->smallInteger('flag_count')->default(0);
            $table->text('daftar_masalah')->nullable();
            $table->text('rekomendasi')->nullable();
            $table->timestamp('calculated_at')->useCurrent();
            $table->timestamps();

            $table->foreign('kode_desa')->references('kode_desa')->on('desa');
            $table->index('kelas_urgensi');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indeks_urgensi');
    }
};