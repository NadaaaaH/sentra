<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IndeksUrgensiSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/indeks_urgensi.csv');
        $rows = array_map('str_getcsv', file($path));
        $header = array_shift($rows);

        $batch = [];
        foreach ($rows as $row) {
            $data = array_combine($header, $row);
            $batch[] = [
                'kode_desa'      => $data['kode_desa'],
                'skor_komposit'  => $data['skor_komposit'],
                'kelas_urgensi'  => (int) $data['kelas_urgensi'],
                'label_urgensi'  => $data['label_urgensi'],
                'flag_count'     => 0,
                'kode_temporary' => (int) ($data['kode_temporary'] ?? 0),
                'daftar_masalah' => $data['daftar_masalah'] ?: null,
                'rekomendasi'    => $data['rekomendasi'] ?: null,
                'calculated_at'  => now(),
                'created_at'     => now(),
                'updated_at'     => now(),
            ];

            if (count($batch) >= 500) {
                DB::table('indeks_urgensi')->insert($batch);
                $batch = [];
            }
        }
        if (!empty($batch)) {
            DB::table('indeks_urgensi')->insert($batch);
        }

        $this->command->info('Indeks Urgensi: ' . count($rows) . ' baris');
    }
}