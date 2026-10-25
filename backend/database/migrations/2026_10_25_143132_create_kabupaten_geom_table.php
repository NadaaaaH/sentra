<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kabupaten_geom', function (Blueprint $table) {
            $table->id();
            $table->char('kode_kab', 4)->unique();
            $table->geometry('geom', 'multipolygon', 4326);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kabupaten_geom');
    }
};