<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kabupaten', function (Blueprint $table) {
            $table->id();
            $table->char('kode_kab', 4)->unique();
            $table->char('kode_prov', 2);
            $table->string('nama_kabupaten');
            $table->enum('tipe', ['kabupaten', 'kota'])->default('kabupaten');
            $table->float('rata2_idm_desa')->nullable();
            $table->float('persen_miskin_kab')->nullable();
            $table->float('akses_air_minum_persen')->nullable();
            $table->float('akses_internet_layak_persen')->nullable();
            $table->float('jumlah_rs_kab')->nullable();
            $table->float('jumlah_sekolah_kab')->nullable();
            $table->float('jumlah_penduduk')->nullable();
            $table->float('rs_per_10rb_penduduk')->nullable();
            $table->float('sekolah_per_10rb_penduduk')->nullable();
            $table->timestamps();

            $table->foreign('kode_prov')->references('kode_prov')->on('provinsi');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kabupaten');
    }
};