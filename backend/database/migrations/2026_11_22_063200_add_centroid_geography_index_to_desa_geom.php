<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            'CREATE INDEX IF NOT EXISTS desa_geom_centroid_geog_gist_idx '
            . 'ON desa_geom USING GIST ((ST_Centroid(geom)::geography))'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS desa_geom_centroid_geog_gist_idx');
    }
};
