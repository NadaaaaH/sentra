<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class MapFacilitiesCacheTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('desa_geom', function (Blueprint $table): void {
            $table->string('kode_desa')->primary();
            $table->text('geom');
        });

        Schema::create('desa', function (Blueprint $table): void {
            $table->string('kode_desa')->primary();
            $table->string('nama_desa');
        });

        Schema::create('faskes_point', function (Blueprint $table): void {
            $table->id();
            $table->string('nama');
            $table->string('tipe_faskes')->nullable();
            $table->float('lat');
            $table->float('lon');
            $table->text('geom');
        });

        Schema::create('sekolah_point', function (Blueprint $table): void {
            $table->id();
            $table->string('nama');
            $table->string('jenjang')->nullable();
            $table->float('lat');
            $table->float('lon');
            $table->text('geom');
        });

        DB::connection()->getPdo()->sqliteCreateFunction(
            'ST_Contains',
            static fn (string $polygon, string $point): int => 1,
        );

        DB::table('desa_geom')->insert([
            'kode_desa' => '3301012001',
            'geom' => 'test-polygon',
        ]);
        DB::table('desa')->insert([
            'kode_desa' => '3301012001',
            'nama_desa' => 'Tambakreja',
        ]);
        DB::table('faskes_point')->insert([
            'nama' => 'Puskesmas Tambakreja',
            'tipe_faskes' => 'Puskesmas',
            'lat' => -7.5,
            'lon' => 108.7,
            'geom' => 'test-point',
        ]);
        DB::table('sekolah_point')->insert([
            'nama' => 'SD Tambakreja',
            'jenjang' => 'SD',
            'lat' => -7.5,
            'lon' => 108.7,
            'geom' => 'test-point',
        ]);
    }

    public function test_facilities_cache_returns_identical_array_data_on_cold_and_warm_requests(): void
    {
        $cacheKey = 'desa-fasilitas:v1:3301012001';
        Cache::forget($cacheKey);

        $coldResponse = $this->getJson('/api/map/fasilitas-desa/3301012001')
            ->assertOk();

        $cached = Cache::get($cacheKey);
        $this->assertIsArray($cached);
        $this->assertIsArray($cached['detail_faskes']);
        $this->assertIsArray($cached['detail_sekolah']);
        $this->assertIsArray($cached['detail_faskes'][0]);
        $this->assertIsArray($cached['detail_sekolah'][0]);

        $warmResponse = $this->getJson('/api/map/fasilitas-desa/3301012001')
            ->assertOk();

        $this->assertSame($coldResponse->json(), $warmResponse->json());
        $this->assertIsArray($coldResponse->json('data.detail_faskes'));
        $this->assertIsArray($coldResponse->json('data.detail_sekolah'));
        $this->assertIsArray($warmResponse->json('data.detail_faskes'));
        $this->assertIsArray($warmResponse->json('data.detail_sekolah'));
    }
}
