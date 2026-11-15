<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SmartMatchingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('kabupaten', function (Blueprint $table): void {
            $table->string('kode_kab')->primary();
            $table->string('nama_kabupaten');
            $table->float('akses_air_minum_persen')->nullable();
            $table->float('akses_internet_layak_persen')->nullable();
        });

        Schema::create('kecamatan', function (Blueprint $table): void {
            $table->string('kode_kec')->primary();
            $table->string('kode_kab');
            $table->string('nama_kecamatan');
        });

        Schema::create('desa', function (Blueprint $table): void {
            $table->string('kode_desa')->primary();
            $table->string('kode_kec');
            $table->string('nama_desa');
            $table->string('unit_type')->default('desa');
            $table->float('iks_2024')->nullable();
            $table->float('ike_2024')->nullable();
            $table->float('ikl_2024')->nullable();
            $table->float('jarak_sekolah_resmi_km')->nullable();
            $table->float('jarak_faskes_fix_km')->nullable();
        });

        Schema::create('indeks_urgensi', function (Blueprint $table): void {
            $table->string('kode_desa')->primary();
            $table->float('skor_komposit')->nullable();
        });

        Schema::create('activities', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('category');
            $table->unsignedBigInteger('min_budget');
            $table->unsignedBigInteger('max_budget')->default(0);
            $table->unsignedInteger('required_people');
            $table->unsignedInteger('duration_days');
        });

        Schema::create('desa_geom', function (Blueprint $table): void {
            $table->string('kode_desa')->primary();
            $table->text('geom');
        });

        $pdo = DB::connection()->getPdo();
        $pdo->sqliteCreateFunction('ST_Centroid', static fn (string $geometry): string => $geometry);
        $pdo->sqliteCreateFunction('ST_Distance', static function (string $first, string $second): float {
            preg_match('/^POINT\(([-0-9.]+) ([-0-9.]+)\)$/', $first, $firstPoint);
            preg_match('/^POINT\(([-0-9.]+) ([-0-9.]+)\)$/', $second, $secondPoint);

            if (count($firstPoint) !== 3 || count($secondPoint) !== 3) {
                throw new \InvalidArgumentException('SQLite spatial test geometries must be POINT values.');
            }

            $earthRadiusMeters = 6371008.8;
            $latitudeDifference = deg2rad((float) $secondPoint[2] - (float) $firstPoint[2]);
            $longitudeDifference = deg2rad((float) $secondPoint[1] - (float) $firstPoint[1]);
            $firstLatitude = deg2rad((float) $firstPoint[2]);
            $secondLatitude = deg2rad((float) $secondPoint[2]);
            $haversine = sin($latitudeDifference / 2) ** 2
                + cos($firstLatitude) * cos($secondLatitude) * sin($longitudeDifference / 2) ** 2;

            return 2 * $earthRadiusMeters * asin(min(1, sqrt($haversine)));
        });

        DB::table('kabupaten')->insert([
            'kode_kab' => '3301',
            'nama_kabupaten' => 'Cilacap',
            'akses_internet_layak_persen' => 80,
        ]);
        DB::table('kecamatan')->insert([
            'kode_kec' => '330101',
            'kode_kab' => '3301',
            'nama_kecamatan' => 'Kedungreja',
        ]);
        DB::table('desa')->insert([
            'kode_desa' => '3301012001',
            'kode_kec' => '330101',
            'nama_desa' => 'TAMBAKREJA',
            'unit_type' => 'desa',
            'jarak_sekolah_resmi_km' => 0.5,
            'jarak_faskes_fix_km' => 8,
        ]);
        DB::table('desa_geom')->insert([
            'kode_desa' => '3301012001',
            'geom' => 'POINT(110 -7)',
        ]);
        DB::table('indeks_urgensi')->insert([
            'kode_desa' => '3301012001',
            'skor_komposit' => 70,
        ]);
        DB::table('activities')->insert([
            'title' => 'Kegiatan kesehatan',
            'category' => 'kesehatan',
            'min_budget' => 20000000,
            'max_budget' => 50000000,
            'required_people' => 4,
            'duration_days' => 14,
        ]);
    }

    public function test_it_returns_database_matches_and_lowers_score_when_budget_is_below_reference(): void
    {
        config(['services.gemini.key' => null]);

        $response = $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 5000000,
            'pelaksana' => 2,
            'durasi' => 14,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'Berhasil mencocokkan program dengan wilayah target')
            ->assertJsonPath('data.0.region_id', '3301012001')
            ->assertJsonPath('data.0.village_name', 'Desa Tambakreja')
            ->assertJsonPath('data.0.district_name', 'Kedungreja')
            ->assertJsonPath('data.0.match_score', 68)
            ->assertJsonPath('data.0.distance_km', 0)
            ->assertJsonPath('data.0.feasibility_status', 'Layak dengan Penyesuaian')
            ->assertJsonPath('data.0.recommended_action', fn (string $action): bool => str_contains($action, 'pilot'))
            ->assertJsonMissingPath('data.0.scoring_context');
    }

    public function test_it_uses_structured_gemini_explanations_without_replacing_internal_scores(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        Http::fake([
            'https://gemini.test/generate' => Http::response([
                'candidates' => [[
                    'content' => [
                        'parts' => [[
                            'text' => json_encode([
                                'matches' => [[
                                    'region_id' => '3301012001',
                                    'match_reason' => 'Jarak fasilitas kesehatan menunjukkan kebutuhan tinggi.',
                                    'recommended_action' => 'Lakukan pemeriksaan dasar keliling.',
                                ]],
                            ]),
                        ]],
                    ],
                ]],
            ]),
        ]);

        $response = $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.0.match_score', 88)
            ->assertJsonPath('data.0.match_reason', 'Jarak fasilitas kesehatan menunjukkan kebutuhan tinggi.')
            ->assertJsonPath('data.0.recommended_action', 'Lakukan pemeriksaan dasar keliling.');

        Http::assertSent(fn (Request $request): bool => $request->hasHeader('x-goog-api-key', 'test-key')
            && $request['generationConfig']['responseMimeType'] === 'application/json');
    }

    public function test_it_rejects_program_categories_outside_the_supported_list(): void
    {
        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kemiskinan',
            'anggaran' => 10000000,
            'pelaksana' => 2,
            'durasi' => 10,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('bidang');
    }

    public function test_it_rejects_a_domisili_that_does_not_exist(): void
    {
        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
            'domisili' => 'not-a-village',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('domisili');
    }

    public function test_it_returns_empty_matches_when_the_default_domisili_has_no_geometry(): void
    {
        config(['services.gemini.key' => null]);
        DB::table('desa_geom')->where('kode_desa', '3301012001')->delete();

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
        ])
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data', [])
            ->assertJsonPath('message', 'Desa domisili belum memiliki geometri yang dapat digunakan.');
    }

    public function test_it_excludes_villages_outside_the_domisili_radius(): void
    {
        config(['services.gemini.key' => null]);
        $this->addHealthVillage('3301012002', 'POINT(110.2 -7)');

        $response = $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
            'domisili' => '3301012001',
            'radius_km' => 10,
        ]);
        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.region_id', '3301012001')
            ->assertJsonMissing(['region_id' => '3301012002']);
    }

    public function test_it_returns_distance_and_preserves_the_existing_match_score_for_nearby_villages(): void
    {
        config(['services.gemini.key' => null]);
        $this->addHealthVillage('3301012002', 'POINT(110.05 -7)');

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 5000000,
            'pelaksana' => 2,
            'durasi' => 14,
            'domisili' => '3301012001',
            'radius_km' => 10,
        ])
            ->assertOk()
            ->assertJsonPath('data.0.region_id', '3301012001')
            ->assertJsonPath('data.0.match_score', 68)
            ->assertJsonPath('data.1.region_id', '3301012002')
            ->assertJsonPath('data.1.distance_km', 5.5)
            ->assertJsonPath('data.1.match_score', 59);
    }

    public function test_it_uses_the_default_domisili_and_radius_when_omitted(): void
    {
        config(['services.gemini.key' => null]);
        $this->addHealthVillage('3301012002', 'POINT(110.2 -7)');

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
        ])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.region_id', '3301012001')
            ->assertJsonPath('data.0.distance_km', 0);
    }

    public function test_it_only_lists_categories_with_valid_activity_ranges(): void
    {
        DB::table('activities')->insert([
            'title' => 'Aktivitas tanpa rentang valid',
            'category' => 'internet',
            'min_budget' => 10000000,
            'max_budget' => 5000000,
            'required_people' => 5,
            'duration_days' => 14,
        ]);

        $this->getJson('/api/v1/smart-matching/categories')
            ->assertOk()
            ->assertJsonPath('data', [
                ['value' => 'kesehatan', 'label' => 'Kesehatan'],
            ]);
    }

    public function test_it_uses_the_district_internet_access_gap_for_internet_matches(): void
    {
        config(['services.gemini.key' => null]);
        DB::table('activities')->insert([
            'title' => 'Program internet komunitas',
            'category' => 'internet',
            'min_budget' => 10000000,
            'max_budget' => 20000000,
            'required_people' => 5,
            'duration_days' => 14,
        ]);

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'internet',
            'anggaran' => 10000000,
            'pelaksana' => 5,
            'durasi' => 14,
        ])
            ->assertOk()
            ->assertJsonPath('data.0.region_id', '3301012001')
            ->assertJsonPath('data.0.match_score', 52);
    }

    public function test_health_matches_use_health_index_and_health_facility_distance(): void
    {
        config(['services.gemini.key' => null]);
        DB::table('desa')->where('kode_desa', '3301012001')->update(['iks_2024' => 0.5]);

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
        ])
            ->assertOk()
            ->assertJsonPath('data.0.match_score', 79)
            ->assertJsonPath('data.0.match_reason', fn (string $reason): bool => str_contains(
                strtolower($reason),
                'kesenjangan indikator kesehatan sekitar 50%',
            ));
    }

    public function test_infrastructure_matches_use_land_quality_and_district_drinking_water_gaps(): void
    {
        config(['services.gemini.key' => null]);
        DB::table('activities')->insert([
            'title' => 'Perbaikan infrastruktur',
            'category' => 'infrastruktur',
            'min_budget' => 10000000,
            'max_budget' => 20000000,
            'required_people' => 4,
            'duration_days' => 14,
        ]);
        DB::table('kabupaten')->where('kode_kab', '3301')->update(['akses_air_minum_persen' => 80]);
        DB::table('desa')->where('kode_desa', '3301012001')->update(['ikl_2024' => 0.4]);

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'infrastruktur',
            'anggaran' => 10000000,
            'pelaksana' => 4,
            'durasi' => 14,
        ])
            ->assertOk()
            ->assertJsonPath('data.0.match_score', 64)
            ->assertJsonPath('data.0.match_reason', fn (string $reason): bool => str_contains(
                strtolower($reason),
                'kesenjangan kualitas lahan sekitar 60%',
            ) && str_contains(strtolower($reason), 'kesenjangan akses air minum kabupaten sekitar 20%'));
    }

    public function test_economy_matches_use_economic_index_and_are_not_listed_without_data(): void
    {
        DB::table('activities')->insert([
            'title' => 'Penguatan ekonomi masyarakat',
            'category' => 'ekonomi',
            'min_budget' => 10000000,
            'max_budget' => 20000000,
            'required_people' => 4,
            'duration_days' => 14,
        ]);

        $this->getJson('/api/v1/smart-matching/categories')
            ->assertOk()
            ->assertJsonMissing(['value' => 'ekonomi', 'label' => 'Ekonomi']);

        DB::table('desa')->where('kode_desa', '3301012001')->update(['ike_2024' => 0.3]);
        config(['services.gemini.key' => null]);

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'ekonomi',
            'anggaran' => 10000000,
            'pelaksana' => 4,
            'durasi' => 14,
        ])
            ->assertOk()
            ->assertJsonPath('data.0.match_score', 82)
            ->assertJsonPath('data.0.match_reason', fn (string $reason): bool => str_contains(
                strtolower($reason),
                'kesenjangan indikator ekonomi sekitar 70%',
            ));
    }

    public function test_it_does_not_use_default_requirements_when_the_category_has_no_activity(): void
    {
        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'pendidikan',
            'anggaran' => 10000000,
            'pelaksana' => 5,
            'durasi' => 14,
        ])
            ->assertOk()
            ->assertJsonPath('data', [])
            ->assertJsonPath(
                'message',
                'Belum ada acuan aktivitas dengan rentang anggaran, jumlah pelaksana, dan durasi yang valid untuk bidang ini.',
            );
    }

    public function test_it_notifies_the_user_when_duration_is_shorter_than_every_activity(): void
    {
        config(['services.gemini.key' => null]);

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 7,
        ])
            ->assertOk()
            ->assertJsonPath('data', [])
            ->assertJsonPath(
                'message',
                'Durasi 7 hari belum memungkinkan untuk aktivitas di bidang ini. Durasi terpendek pada acuan adalah 14 hari (Kegiatan kesehatan). Tambah durasi atau sesuaikan cakupan program.',
            );
    }

    public function test_it_uses_the_closest_activity_range_without_default_estimates(): void
    {
        config(['services.gemini.key' => null]);
        DB::table('activities')->insert([
            'title' => 'Program kesehatan ringan',
            'category' => 'kesehatan',
            'min_budget' => 2000000,
            'max_budget' => 4000000,
            'required_people' => 5,
            'duration_days' => 7,
        ]);

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 3000000,
            'pelaksana' => 5,
            'durasi' => 7,
        ])
            ->assertOk()
            ->assertJsonPath(
                'data.0.recommended_action',
                'Acuan terdekat: "Program kesehatan ringan". Fokuskan 5 pelaksana selama 7 hari pada penyuluhan kesehatan dan pemeriksaan dasar, dimulai dari kelompok atau lokasi dengan kebutuhan tertinggi.',
            );
    }

    private function addHealthVillage(string $kodeDesa, string $geometry): void
    {
        DB::table('desa')->insert([
            'kode_desa' => $kodeDesa,
            'kode_kec' => '330101',
            'nama_desa' => 'DESA UJI',
            'unit_type' => 'desa',
            'iks_2024' => 0.5,
            'jarak_faskes_fix_km' => 8,
        ]);
        DB::table('desa_geom')->insert([
            'kode_desa' => $kodeDesa,
            'geom' => $geometry,
        ]);
    }
}
