<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        DB::statement('CREATE INDEX IF NOT EXISTS faskes_point_geom_gist_idx ON faskes_point USING GIST (geom)');
        DB::statement('CREATE INDEX IF NOT EXISTS sekolah_point_geom_gist_idx ON sekolah_point USING GIST (geom)');
        DB::statement('CREATE INDEX IF NOT EXISTS desa_nama_desa_lower_trgm_gin_idx ON desa USING GIN (LOWER(nama_desa) gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS kabupaten_nama_kabupaten_lower_trgm_gin_idx ON kabupaten USING GIN (LOWER(nama_kabupaten) gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS kecamatan_kode_kab_idx ON kecamatan (kode_kab)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS kecamatan_kode_kab_idx');
        DB::statement('DROP INDEX IF EXISTS kabupaten_nama_kabupaten_lower_trgm_gin_idx');
        DB::statement('DROP INDEX IF EXISTS desa_nama_desa_lower_trgm_gin_idx');
        DB::statement('DROP INDEX IF EXISTS sekolah_point_geom_gist_idx');
        DB::statement('DROP INDEX IF EXISTS faskes_point_geom_gist_idx');
    }
};
