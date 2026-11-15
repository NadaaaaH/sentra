<?php

namespace Tests\Feature;

use App\Services\ActivityRecommendationService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Mockery;
use Tests\TestCase;

class ActivityRecommendationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

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
            $table->float('nilai_idm_2024')->nullable();
            $table->string('status_idm_2024')->nullable();
            $table->float('jarak_sekolah_resmi_km')->nullable();
            $table->float('jarak_faskes_fix_km')->nullable();
            $table->string('faskes_terdekat')->nullable();
            $table->string('tipe_faskes_terdekat')->nullable();
        });
        Schema::create('indeks_urgensi', function (Blueprint $table): void {
            $table->string('kode_desa')->primary();
            $table->float('skor_komposit')->nullable();
            $table->text('rekomendasi')->nullable();
        });
        Schema::create('activities', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('category');
            $table->text('description');
            $table->unsignedBigInteger('min_budget');
            $table->unsignedBigInteger('max_budget');
            $table->unsignedInteger('required_people');
            $table->unsignedInteger('duration_days');
            $table->timestamps();
        });

        DB::table('kabupaten')->insert([
            'kode_kab' => '3301',
            'nama_kabupaten' => 'Cilacap',
            'akses_air_minum_persen' => 10,
            'akses_internet_layak_persen' => 20,
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
            'iks_2024' => 0.1,
            'ike_2024' => 0.3,
            'ikl_2024' => 0.2,
            'jarak_sekolah_resmi_km' => 3,
            'jarak_faskes_fix_km' => 10,
        ]);

        foreach (['kesehatan', 'pendidikan', 'internet', 'infrastruktur', 'ekonomi'] as $category) {
            foreach ([1, 2, 3] as $index) {
                DB::table('activities')->insert([
                    'title' => ucfirst($category).' test '.$index,
                    'category' => $category,
                    'description' => "Deskripsi asli {$category} {$index}",
                    'min_budget' => 1000000 * $index,
                    'max_budget' => 2000000 * $index,
                    'required_people' => $index + 2,
                    'duration_days' => 7 * $index,
                ]);
            }
        }
    }

    public function test_selected_category_returns_three_exact_dataset_items_and_two_ai_suggestions(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        Http::fake([
            'https://gemini.test/generate' => fn ($request) => $this->geminiResponse($request),
        ]);

        $response = $this->getJson('/api/v1/regions/desa/3301012001/recommendations?bidang=pendidikan&budget=3000000&people=4&duration=14');

        $response
            ->assertOk()
            ->assertJsonPath('data.ai_available', true)
            ->assertJsonCount(5, 'data.recommendations')
            ->assertJsonPath('data.recommendations.3.source', 'ai')
            ->assertJsonPath('data.recommendations.4.source', 'ai');

        $recommendations = $response->json('data.recommendations');
        $this->assertSame(['pendidikan'], array_values(array_unique(array_column($recommendations, 'category'))));

        foreach (array_slice($recommendations, 0, 3) as $recommendation) {
            $activity = DB::table('activities')->where('id', $recommendation['id'])->first();
            $this->assertSame($activity->title, $recommendation['title']);
            $this->assertSame($activity->category, $recommendation['category']);
            $this->assertSame($activity->description, $recommendation['description']);
            $this->assertSame((int) $activity->min_budget, $recommendation['budget_min']);
            $this->assertSame((int) $activity->max_budget, $recommendation['budget_max']);
            $this->assertSame((int) $activity->required_people, $recommendation['people']);
            $this->assertSame((int) $activity->duration_days, $recommendation['duration']);
            $this->assertNull($recommendation['file_url']);
            $this->assertNull($recommendation['kabupaten']);
            $this->assertNull($recommendation['desa']);
        }
    }

    public function test_map_recommendations_have_five_items_with_at_most_two_per_category(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        Http::fake([
            'https://gemini.test/generate' => fn ($request) => $this->geminiResponse($request),
        ]);

        $response = $this->getJson('/api/v1/regions/desa/3301012001/recommendations');
        $response->assertOk()->assertJsonCount(5, 'data.recommendations');

        $recommendations = $response->json('data.recommendations');
        $this->assertSame(['dataset', 'dataset', 'dataset', 'ai', 'ai'], array_column($recommendations, 'source'));
        foreach (array_count_values(array_column($recommendations, 'category')) as $count) {
            $this->assertLessThanOrEqual(2, $count);
        }
        $this->assertSame('kesehatan', $recommendations[0]['category']);
    }

    public function test_gemini_failure_falls_back_to_three_dataset_recommendations(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        Http::fake(['https://gemini.test/generate' => Http::response(['error' => 'unavailable'], 503)]);

        $response = $this->getJson('/api/v1/regions/desa/3301012001/recommendations?bidang=pendidikan&budget=3000000&people=4&duration=14');
        $response
            ->assertOk()
            ->assertJsonPath('data.ai_available', false)
            ->assertJsonCount(3, 'data.recommendations');

        $this->assertSame(
            ['dataset', 'dataset', 'dataset'],
            array_column($response->json('data.recommendations'), 'source'),
        );
    }

    public function test_gemini_fallback_is_not_cached_and_next_request_retries(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        $attempts = 0;
        Http::fake([
            'https://gemini.test/generate' => function ($request) use (&$attempts) {
                $attempts++;

                return $attempts === 1
                    ? Http::response(['error' => 'temporarily unavailable'], 503)
                    : $this->geminiResponse($request);
            },
        ]);
        $url = '/api/v1/regions/desa/3301012001/recommendations?bidang=pendidikan&budget=3000000&people=4&duration=14';

        $this->getJson($url)
            ->assertOk()
            ->assertJsonPath('data.ai_available', false);
        $this->getJson($url)
            ->assertOk()
            ->assertJsonPath('data.ai_available', true)
            ->assertJsonCount(5, 'data.recommendations');

        $this->assertSame(2, $attempts);
    }

    public function test_detail_endpoint_accepts_false_query_and_does_not_generate_recommendations(): void
    {
        $recommendations = Mockery::mock(ActivityRecommendationService::class);
        $recommendations->shouldNotReceive('generate');
        $this->app->instance(ActivityRecommendationService::class, $recommendations);

        $this->getJson('/api/v1/regions/desa/3301012001?include_recommendations=false')
            ->assertOk()
            ->assertJsonPath('data.nama', 'TAMBAKREJA')
            ->assertJsonPath('data.kesenjangan.0.label', 'Kesehatan')
            ->assertJsonPath('data.potensi.0', 'Potensi pengembangan berbasis aset dan kebutuhan lokal wilayah.')
            ->assertJsonPath('data.recommendations', [])
            ->assertJsonPath('data.ai_available', false);
    }

    public function test_detail_endpoint_does_not_generate_recommendations_by_default(): void
    {
        $recommendations = Mockery::mock(ActivityRecommendationService::class);
        $recommendations->shouldNotReceive('generate');
        $this->app->instance(ActivityRecommendationService::class, $recommendations);

        $this->getJson('/api/v1/regions/desa/3301012001')
            ->assertOk()
            ->assertJsonPath('data.recommendations', [])
            ->assertJsonPath('data.ai_available', false);
    }

    public function test_detail_endpoint_rejects_invalid_recommendation_flag(): void
    {
        $this->getJson('/api/v1/regions/desa/3301012001?include_recommendations=maybe')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('include_recommendations');
    }

    private function geminiResponse($request)
    {
        $prompt = $request['contents'][0]['parts'][0]['text'];
        preg_match('/Kegiatan dataset terpilih.*?: (\[.*\])\nKategori saran AI yang harus dipakai berurutan: (\[.*\])$/s', $prompt, $matches);
        $dataset = json_decode($matches[1] ?? '[]', true);
        $categories = json_decode($matches[2] ?? '[]', true);

        return Http::response([
            'candidates' => [[
                'content' => [
                    'parts' => [[
                        'text' => json_encode([
                            'dataset_explanations' => array_map(
                                fn (array $item): array => [
                                    'activity_id' => $item['activity_id'],
                                    'explanation' => 'Kegiatan relevan dengan kondisi indikator desa.',
                                ],
                                $dataset,
                            ),
                            'ai_recommendations' => array_map(
                                fn (string $category, int $index): array => [
                                    'category' => $category,
                                    'title' => 'Saran tambahan '.$category.' '.$index,
                                    'summary' => 'Kegiatan tambahan sesuai kebutuhan lokal.',
                                    'explanation' => 'Saran ini menanggapi indikator desa yang tersedia.',
                                    'budget_min' => 1000000,
                                    'budget_max' => 2000000,
                                    'people' => 4,
                                    'duration' => 14,
                                ],
                                $categories,
                                array_keys($categories),
                            ),
                        ]),
                    ]],
                ],
            ]],
        ]);
    }
}
