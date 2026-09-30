<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->string('title');              // Contoh: "Pengadaan Puskesmas Keliling"
            $table->string('category');           // kesehatan, pendidikan, internet, infrastruktur
            $table->text('description');          // Penjelasan singkat program
            $table->bigInteger('min_budget');     // Misal: 20000000
            $table->bigInteger('max_budget');     // Misal: 50000000
            $table->integer('required_people');   // Misal: 5 (kebutuhan personel)
            $table->integer('duration_days');     // Misal: 14 (durasi pelaksanaan)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
