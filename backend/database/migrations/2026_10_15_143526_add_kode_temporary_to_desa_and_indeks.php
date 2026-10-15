<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('desa', function (Blueprint $table) {
            $table->boolean('kode_temporary')->default(false)->after('unit_type');
        });

        Schema::table('indeks_urgensi', function (Blueprint $table) {
            $table->boolean('kode_temporary')->default(false)->after('flag_count');
        });
    }

    public function down(): void
    {
        Schema::table('desa', function (Blueprint $table) {
            $table->dropColumn('kode_temporary');
        });

        Schema::table('indeks_urgensi', function (Blueprint $table) {
            $table->dropColumn('kode_temporary');
        });
    }
};