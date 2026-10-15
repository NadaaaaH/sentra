<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kecamatan', function (Blueprint $table) {
            $table->id();
            $table->char('kode_kec', 7)->unique();
            $table->char('kode_kab', 4);
            $table->string('nama_kecamatan');
            $table->timestamps();

            $table->foreign('kode_kab')->references('kode_kab')->on('kabupaten');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kecamatan');
    }
};