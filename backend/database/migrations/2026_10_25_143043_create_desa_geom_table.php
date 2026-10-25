<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('desa_geom', function (Blueprint $table) {
            $table->id();
            $table->char('kode_desa', 10)->unique(); // Join ke tabel desa Nada
            $table->geometry('geom', 'multipolygon', 4326); // Tipe spasial PostGIS
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('desa_geom');
    }
};