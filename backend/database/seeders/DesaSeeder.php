<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DesaSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/desa.csv');
        $rows = array_map('str_getcsv', file($path));
        $header = array_shift($rows);

        // Batch insert biar cepat (8.500 baris)
        $batch = [];
        foreach ($rows as $i => $row) {
            $data = array_combine($header, $row);
            $batch[] = [
                'kode_desa'              => $data['kode_desa'],
                'kode_kec'               => $data['kode_kec'],
                'nama_desa'              => $data['nama_desa'],
                'unit_type'              => $data['unit_type'] ?? 'desa',
                'kode_temporary'         => (int) ($data['kode_temporary'] ?? 0),
                'iks_2024'               => $data['iks_2024'] ?: null,
                'ike_2024'               => $data['ike_2024'] ?: null,
                'ikl_2024'               => $data['ikl_2024'] ?: null,
                'nilai_idm_2024'         => $data['nilai_idm_2024'] ?: null,
                'status_idm_2024'        => $data['status_idm_2024'] ?: null,
                'jarak_sekolah_resmi_km' => $data['jarak_sekolah_resmi_km'] ?: null,
                'jarak_faskes_fix_km'    => $data['jarak_faskes_fix_km'] ?: null,
                'faskes_terdekat'        => $data['faskes_terdekat'] ?: null,
                'tipe_faskes_terdekat'   => $data['tipe_faskes_terdekat'] ?: null,
                'created_at'             => now(),
                'updated_at'             => now(),
            ];

            // Insert per 500 baris
            if (count($batch) >= 500) {
                DB::table('desa')->insert($batch);
                $batch = [];
            }
        }
        if (!empty($batch)) {
            DB::table('desa')->insert($batch);
        }

        $this->command->info('Desa: ' . count($rows) . ' baris');
    }
}