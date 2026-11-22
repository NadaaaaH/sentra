<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SmartMatchingTest extends TestCase
{
    private string $rankCachePath;

    protected function setUp(): void
    {
        parent::setUp();
        $this->rankCachePath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'sentra-sm-rank-'.bin2hex(random_bytes(8));
        config(['cache.stores.file.path' => $this->rankCachePath]);

        Schema::create('kabupaten', function (Blueprint $table): void {
            $table->string('kode_kab')->primary();
            $table->string('nama_kabupaten');
            $table->string('tipe')->default('kabupaten');
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
        $distanceInMeters = static function (string $first, string $second): float {
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
        };
        $pdo->sqliteCreateFunction('ST_Distance', $distanceInMeters);
        $pdo->sqliteCreateFunction(
            'ST_DWithin',
            static fn (string $first, string $second, float $radiusMeters): int => (
                $distanceInMeters($first, $second) <= $radiusMeters ? 1 : 0
            ),
        );

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

    protected function tearDown(): void
    {
        File::deleteDirectory($this->rankCachePath);

        parent::tearDown();
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
            ->assertJsonPath('message', 'Berhasil mencocokkan program dengan seluruh wilayah tersedia.')
            ->assertJsonPath('data.0.region_id', '3301012001')
            ->assertJsonPath('data.0.village_name', 'Desa Tambakreja')
            ->assertJsonPath('data.0.district_name', 'Kedungreja')
            ->assertJsonPath('data.0.match_score', 53)
            ->assertJsonPath('data.0.distance_km', null)
            ->assertJsonPath('data.0.feasibility_status', 'Layak dengan Penyesuaian')
            ->assertJsonPath(
                'data.0.feasibility_message',
                'Anggaran operasional berpotensi tidak mencukupi untuk durasi 14 hari (Rp5.000.000 tersedia; estimasi minimum Rp20.000.000). Jumlah pelaksana berpotensi kurang (2 tersedia; acuan 4 orang).',
            )
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
            ->assertJsonPath('data.0.match_score', 90)
            ->assertJsonPath('data.0.resources_sufficient', true)
            ->assertJsonPath(
                'data.0.feasibility_message',
                'Anggaran, jumlah pelaksana, dan durasi sudah sesuai kebutuhan.',
            )
            ->assertJsonPath('data.0.match_reason', 'Jarak fasilitas kesehatan menunjukkan kebutuhan tinggi.')
            ->assertJsonPath('data.0.recommended_action', 'Lakukan pemeriksaan dasar keliling.');

        Http::assertSent(fn (Request $request): bool => $request->hasHeader('x-goog-api-key', 'test-key')
            && $request['generationConfig']['responseMimeType'] === 'application/json');
    }

    public function test_it_returns_fallback_matches_when_gemini_fails(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        Http::fake([
            'https://gemini.test/generate' => Http::response(['error' => 'unavailable'], 503),
        ]);

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
        ])
            ->assertOk()
            ->assertJsonPath('data.0.region_id', '3301012001')
            ->assertJsonPath('data.0.match_score', 90);

        Http::assertSentCount(1);
    }

    public function test_it_caches_gemini_explanations_per_region_across_offset_changes(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        for ($village = 2; $village <= 7; $village++) {
            $code = '33010120'.str_pad((string) $village, 2, '0', STR_PAD_LEFT);
            $this->addHealthVillage($code, 'POINT(110 -7)');
        }

        $payload = [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
            'offset' => 0,
            'limit' => 2,
        ];
        $rankingPayload = $payload;
        unset($rankingPayload['offset'], $rankingPayload['limit']);
        ksort($rankingPayload);
        Cache::store('file')->forget(
            'sm:rank:'.md5(json_encode($rankingPayload, JSON_THROW_ON_ERROR)),
        );

        $promptedRegionIds = [];
        Http::fake([
            'https://gemini.test/generate' => function (Request $request) use (&$promptedRegionIds) {
                preg_match_all(
                    '/"region_id":"(33010120[0-9]+)"/',
                    $request['contents'][0]['parts'][0]['text'],
                    $matches,
                );
                $promptedRegionIds[] = $matches[1];

                return Http::response([
                    'candidates' => [[
                        'content' => [
                            'parts' => [[
                                'text' => json_encode([
                                    'matches' => array_map(
                                        static fn (string $regionId): array => [
                                            'region_id' => $regionId,
                                            'match_reason' => 'Kebutuhan kesehatan terukur.',
                                            'recommended_action' => 'Lakukan layanan kesehatan keliling.',
                                        ],
                                        $matches[1],
                                    ),
                                ]),
                            ]],
                        ],
                    ]],
                ]);
            },
        ]);

        $this->postJson('/api/v1/smart-matching', $payload)
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.match_reason', 'Kebutuhan kesehatan terukur.');

        $this->assertCount(2, $promptedRegionIds[0]);

        $this->postJson('/api/v1/smart-matching', [
            ...$payload,
            'offset' => 1,
            'limit' => 1,
        ])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.match_reason', 'Kebutuhan kesehatan terukur.');

        Http::assertSentCount(1);
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

    public function test_it_rejects_a_location_that_does_not_exist(): void
    {
        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
            'location_type' => 'desa',
            'location_code' => 'not-a-village',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('location_code');
    }

    public function test_it_rejects_a_selected_village_without_geometry(): void
    {
        DB::table('desa_geom')->where('kode_desa', '3301012001')->delete();

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
            'location_type' => 'desa',
            'location_code' => '3301012001',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('location_code');
    }

    public function test_it_excludes_villages_outside_the_selected_origin_radius(): void
    {
        config(['services.gemini.key' => null]);
        $this->addHealthVillage('3301012002', 'POINT(110.2 -7)');

        $response = $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
            'location_type' => 'desa',
            'location_code' => '3301012001',
            'radius_km' => 10,
        ]);
        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.region_id', '3301012001')
            ->assertJsonMissing(['region_id' => '3301012002']);
    }

    public function test_it_blends_program_match_and_proximity_scores_for_nearby_villages(): void
    {
        config(['services.gemini.key' => null]);
        $this->addHealthVillage('3301012002', 'POINT(110.05 -7)');

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 5000000,
            'pelaksana' => 2,
            'durasi' => 14,
            'location_type' => 'desa',
            'location_code' => '3301012001',
            'radius_km' => 10,
        ])
            ->assertOk()
            ->assertJsonPath('data.0.region_id', '3301012001')
            ->assertJsonPath('data.0.program_match_score', 53)
            ->assertJsonPath('data.0.proximity_score', 100)
            ->assertJsonPath('data.0.match_score', 72)
            ->assertJsonPath('data.1.region_id', '3301012002')
            ->assertJsonPath('data.1.distance_km', 5.5)
            ->assertJsonPath('data.1.program_match_score', 45)
            ->assertJsonPath('data.1.proximity_score', 45)
            ->assertJsonPath('data.1.match_score', 45);
    }

    public function test_it_searches_globally_without_an_implicit_origin(): void
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
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.region_id', '3301012001')
            ->assertJsonPath('data.0.distance_km', null)
            ->assertJsonPath('data.1.distance_km', null);
    }

    public function test_it_paginates_matches_without_overlap_and_reports_the_last_page(): void
    {
        config(['services.gemini.key' => null]);

        for ($village = 2; $village <= 7; $village++) {
            $code = '33010120'.str_pad((string) $village, 2, '0', STR_PAD_LEFT);
            $this->addHealthVillage($code, 'POINT(110 -7)');
        }

        $baseInput = [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
        ];

        $firstPage = $this->postJson('/api/v1/smart-matching', $baseInput)
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.total', 7)
            ->assertJsonPath('meta.has_more', true);
        $rankingPayload = $baseInput;
        ksort($rankingPayload);
        $ranking = Cache::store('file')->get(
            'sm:rank:'.md5(json_encode($rankingPayload, JSON_THROW_ON_ERROR)),
        );
        $this->assertIsArray($ranking);
        $this->assertSame(true, $ranking['nearby_found']);
        $this->assertIsArray($ranking['requirements']);
        $this->assertSame([], array_filter(
            $ranking['requirements'],
            static fn (mixed $value): bool => ! is_scalar($value) && $value !== null,
        ));
        $this->assertCount(7, $ranking['items']);
        foreach ($ranking['items'] as $item) {
            $this->assertSame(['region_id', 'match_score', 'distance_km'], array_keys($item));
            $this->assertSame([], array_filter(
                $item,
                static fn (mixed $value): bool => ! is_scalar($value) && $value !== null,
            ));
        }

        $lastPage = $this->postJson('/api/v1/smart-matching', [
            ...$baseInput,
            'offset' => 5,
        ])
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 7)
            ->assertJsonPath('meta.has_more', false);

        $firstIds = array_column($firstPage->json('data'), 'region_id');
        $lastIds = array_column($lastPage->json('data'), 'region_id');
        $allScores = array_column(
            [...$firstPage->json('data'), ...$lastPage->json('data')],
            'match_score',
        );
        $sortedScores = $allScores;
        rsort($sortedScores);

        $this->assertSame(
            ['3301012001', '3301012002', '3301012003', '3301012004', '3301012005'],
            $firstIds,
        );
        $this->assertSame(['3301012006', '3301012007'], $lastIds);
        $this->assertSame([], array_intersect($firstIds, $lastIds));
        $this->assertSame($sortedScores, $allScores);
    }

    public function test_it_validates_pagination_parameters(): void
    {
        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
            'offset' => -1,
            'limit' => 21,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['offset', 'limit']);
    }

    public function test_it_limits_candidates_to_a_selected_county(): void
    {
        config(['services.gemini.key' => null]);
        DB::table('kabupaten')->insert([
            'kode_kab' => '3302',
            'nama_kabupaten' => 'Banyumas',
            'tipe' => 'kabupaten',
        ]);
        DB::table('kecamatan')->insert([
            'kode_kec' => '330201',
            'kode_kab' => '3302',
            'nama_kecamatan' => 'Purwokerto',
        ]);
        DB::table('desa')->insert([
            'kode_desa' => '3302012001',
            'kode_kec' => '330201',
            'nama_desa' => 'DESA UJI BANYUMAS',
            'unit_type' => 'desa',
            'iks_2024' => 0.5,
            'jarak_faskes_fix_km' => 8,
        ]);

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 14,
            'location_type' => 'kabupaten',
            'location_code' => '3302',
        ])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.region_id', '3302012001');
    }

    public function test_it_searches_location_options_by_county_and_village(): void
    {
        $this->getJson('/api/v1/smart-matching/locations?q=Cila')
            ->assertOk()
            ->assertJsonPath('data.0.type', 'kabupaten')
            ->assertJsonPath('data.0.code', '3301')
            ->assertJsonPath('data.0.label', 'Kabupaten Cilacap');

        $this->getJson('/api/v1/smart-matching/locations?q=Tamb')
            ->assertOk()
            ->assertJsonPath('data.0.type', 'desa')
            ->assertJsonPath('data.0.code', '3301012001')
            ->assertJsonPath('data.0.label', 'Tambakreja');
    }

    public function test_categories_endpoint_returns_the_same_response_from_cache(): void
    {
        Cache::forget('sm:categories');

        $coldResponse = $this->getJson('/api/v1/smart-matching/categories')
            ->assertOk();
        $cachedCategories = Cache::get('sm:categories');
        $this->assertIsArray($cachedCategories);
        $this->assertIsArray($cachedCategories[0]);

        $warmResponse = $this->getJson('/api/v1/smart-matching/categories')
            ->assertOk();

        $this->assertSame($coldResponse->json(), $warmResponse->json());
    }

    public function test_location_search_endpoint_returns_the_same_response_from_cache(): void
    {
        $cacheKey = 'sm:locations:'.md5(mb_strtolower(trim('Tambak')));
        Cache::forget($cacheKey);

        $coldResponse = $this->getJson('/api/v1/smart-matching/locations?q=Tambak')
            ->assertOk();
        $cachedLocations = Cache::get($cacheKey);
        $this->assertIsArray($cachedLocations);
        $this->assertIsArray($cachedLocations[0]);

        $warmResponse = $this->getJson('/api/v1/smart-matching/locations?q=Tambak')
            ->assertOk();

        $this->assertSame($coldResponse->json(), $warmResponse->json());
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
            ->assertJsonPath('data.0.match_score', 60);
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
            ->assertJsonPath('data.0.match_score', 83)
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
            ->assertJsonPath('data.0.match_score', 70)
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
            ->assertJsonPath('data.0.match_score', 85)
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

    public function test_it_returns_matches_and_warns_when_duration_is_shorter_than_every_activity(): void
    {
        config(['services.gemini.key' => null]);

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 20000000,
            'pelaksana' => 4,
            'durasi' => 7,
        ])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.match_score', 65)
            ->assertJsonPath(
                'data.0.feasibility_message',
                'Durasi pelaksanaan berpotensi tidak mencukupi (7 hari tersedia; acuan 14 hari).',
            )
            ->assertJsonPath('message', 'Berhasil mencocokkan program dengan seluruh wilayah tersedia.');
    }

    public function test_it_scales_estimated_minimum_budget_for_long_program_durations(): void
    {
        config(['services.gemini.key' => null]);

        $this->postJson('/api/v1/smart-matching', [
            'bidang' => 'kesehatan',
            'anggaran' => 2000000,
            'pelaksana' => 15,
            'durasi' => 800,
        ])
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.match_score', 40)
            ->assertJsonPath('data.0.resources_sufficient', false)
            ->assertJsonPath(
                'data.0.feasibility_message',
                'Anggaran operasional berpotensi tidak mencukupi untuk durasi 800 hari (Rp2.000.000 tersedia; estimasi minimum Rp1.142.857.143).',
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
