<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class KabupatenSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/kabupaten.csv');
        $rows = array_map('str_getcsv', file($path));
        $header = array_shift($rows);

        foreach ($rows as $row) {
            $data = array_combine($header, $row);
            DB::table('kabupaten')->insert([
                'kode_kab'                   => $data['kode_kab'],
                'kode_prov'                  => $data['kode_prov'],
                'nama_kabupaten'             => $data['nama_kabupaten'],
                'tipe'                       => $data['tipe'] ?? 'kabupaten',
                'persen_miskin_kab'          => $data['persen_miskin_kab'] ?: null,
                'akses_air_minum_persen'     => $data['akses_air_minum_persen'] ?: null,
                'akses_internet_layak_persen'=> $data['akses_internet_layak_persen'] ?: null,
                'created_at'                 => now(),
                'updated_at'                 => now(),
            ]);
        }

        $this->command->info('Kabupaten: ' . count($rows) . ' baris');
    }
}