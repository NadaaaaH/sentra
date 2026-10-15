<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KecamatanSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/kecamatan.csv');
        $rows = array_map('str_getcsv', file($path));
        $header = array_shift($rows);

        foreach ($rows as $row) {
            $data = array_combine($header, $row);
            DB::table('kecamatan')->insert([
                'kode_kec'       => $data['kode_kec'],
                'kode_kab'       => $data['kode_kab'],
                'nama_kecamatan' => $data['nama_kecamatan'],
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }

        $this->command->info('Kecamatan: ' . count($rows) . ' baris');
    }
}