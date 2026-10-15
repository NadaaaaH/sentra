<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ProvinsiSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/provinsi.csv');
        $rows = array_map('str_getcsv', file($path));
        $header = array_shift($rows);

        foreach ($rows as $row) {
            $data = array_combine($header, $row);
            DB::table('provinsi')->insert([
                'kode_prov'     => $data['kode_prov'],
                'nama_provinsi' => $data['nama_provinsi'],
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }

        $this->command->info('Provinsi: ' . count($rows) . ' baris');
    }
}