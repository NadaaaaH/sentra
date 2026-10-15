<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('desa', function (Blueprint $table) {
            $table->id();
            $table->char('kode_desa', 10)->unique();
            $table->char('kode_kec', 7);
            $table->string('nama_desa');
            $table->enum('unit_type', ['desa', 'kelurahan'])->default('desa');
            $table->float('iks_2024')->nullable();
            $table->float('ike_2024')->nullable();
            $table->float('ikl_2024')->nullable();
            $table->float('nilai_idm_2024')->nullable();
            $table->string('status_idm_2024')->nullable();  // MAJU, BERKEMBANG, dll
            $table->float('jarak_sekolah_resmi_km')->nullable();
            $table->float('jarak_faskes_fix_km')->nullable();
            $table->string('faskes_terdekat')->nullable();
            $table->string('tipe_faskes_terdekat')->nullable();
            $table->timestamps();

            $table->foreign('kode_kec')->references('kode_kec')->on('kecamatan');
            $table->index('kode_kec');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('desa');
    }
};