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
                'title' => 'Pengadaan Puskesmas Keliling',
                'category' => 'kesehatan',
                'description' => 'Penyediaan armada dan tenaga medis keliling untuk menjangkau desa terpencil.',
                'min_budget' => 20000000,
                'max_budget' => 50000000,
                'required_people' => 5,
                'duration_days' => 14,
            ],
            // Tambahkan data program lainnya di sini
        ];

        foreach ($activities as $activity) {
            Activity::updateOrCreate(
                ['title' => $activity['title']],
                $activity
            );
        }
    }
}
