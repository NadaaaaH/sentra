<?php

namespace Database\Seeders;

use App\Models\Activity;
use Illuminate\Database\Seeder;

class ActivitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    
    {
        $activities = [
    [
        'title' => 'Sosialisasi Pencegahan Anemia dan Stunting',
        'category' => 'kesehatan',
        'description' => 'Kegiatan edukasi kepada masyarakat mengenai pencegahan anemia dan stunting melalui penyampaian materi kesehatan dan diskusi. Output kegiatan berupa meningkatnya pemahaman peserta mengenai pola makan, pencegahan anemia, dan faktor risiko stunting.',
        'min_budget' => 2000000,
        'max_budget' => 3500000,
        'required_people' => 6,
        'duration_days' => 3
    ],

    // S2
    [
        'title' => 'Pendampingan Posyandu Balita',
        'category' => 'kesehatan',
        'description' => 'Mahasiswa membantu pelaksanaan kegiatan Posyandu Balita bersama kader dan masyarakat setempat. Output kegiatan berupa dukungan administrasi, pelayanan kegiatan posyandu, serta edukasi sederhana kepada orang tua balita.',
        'min_budget' => 2500000,
        'max_budget' => 4500000,
        'required_people' => 6,
        'duration_days' => 7
    ],

    // S2
    [
        'title' => 'Pendampingan Posyandu Lansia',
        'category' => 'kesehatan',
        'description' => 'Kegiatan pendampingan pelaksanaan Posyandu Lansia yang melibatkan mahasiswa, kader, dan warga lanjut usia. Output kegiatan berupa terselenggaranya pemeriksaan dan aktivitas pendukung kesehatan lansia secara tertib.',
        'min_budget' => 2000000,
        'max_budget' => 4000000,
        'required_people' => 5,
        'duration_days' => 7
    ],

    // S14
    [
        'title' => 'Penyelenggaraan Posyandu Ibu Hamil dan Balita',
        'category' => 'kesehatan',
        'description' => 'Program desa untuk mendukung penyelenggaraan Posyandu bagi ibu hamil dan balita, termasuk penyediaan makanan tambahan dan kebutuhan pelayanan. Output kegiatan berupa tersedianya dukungan makanan tambahan dan perlengkapan pelayanan Posyandu.',
        'min_budget' => 500000000,
        'max_budget' => 700000000,
        'required_people' => 15,
        'duration_days' => 30
    ],

    // S14
    [
        'title' => 'Penyelenggaraan Posyandu Lansia Desa',
        'category' => 'kesehatan',
        'description' => 'Program desa untuk mendukung kegiatan Posyandu Lansia melalui penyediaan kebutuhan konsumsi dan pelayanan kegiatan. Output kegiatan berupa terselenggaranya layanan Posyandu Lansia secara rutin di tingkat desa.',
        'min_budget' => 60000000,
        'max_budget' => 90000000,
        'required_people' => 12,
        'duration_days' => 30
    ],

    // S14
    [
        'title' => 'Penyelenggaraan Rumah Desa Sehat untuk Percepatan Penurunan Stunting',
        'category' => 'kesehatan',
        'description' => 'Kegiatan desa melalui Rumah Desa Sehat untuk mendukung koordinasi dan konvergensi program penurunan stunting. Output kegiatan berupa rapat konvergensi, rembuk stunting, dukungan administrasi, serta koordinasi lintas pihak.',
        'min_budget' => 15000000,
        'max_budget' => 22000000,
        'required_people' => 10,
        'duration_days' => 21
    ],

        ];

        foreach ($activities as $activity) {
            Activity::updateOrCreate(
                ['title' => $activity['title']],
                $activity
            );
        }
    }
}
