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

    public function test_template_explanation_numbers_match_detail_resource_values(): void
    {
        config(['services.gemini.key' => null]);

        $detail = $this->getJson('/api/v1/regions/desa/3301012001?include_recommendations=false')
            ->assertOk()
            ->json('data');
        $gaps = array_column($detail['kesenjangan'], 'nilai', 'label');
        $expectedContexts = [
            'internet' => sprintf(
                'kesenjangan akses internet layak kabupaten/kota %s%%',
                $this->panelNumber($gaps['Akses Internet Layak']),
            ),
            'infrastruktur' => sprintf(
                'kesenjangan kualitas lahan (IKL) %s%% dan kesenjangan akses air minum kabupaten/kota %s%%',
                $this->panelNumber($gaps['Kualitas Lahan']),
                $this->panelNumber($gaps['Akses Air Minum']),
            ),
            'ekonomi' => sprintf(
                'kesenjangan kondisi ekonomi (IKE) %s%%',
                $this->panelNumber($gaps['Kondisi Ekonomi']),
            ),
            'kesehatan' => sprintf(
                'jarak fasilitas kesehatan %s km',
                $this->panelNumber($detail['jarakFaskesKm']),
            ),
            'pendidikan' => sprintf(
                'jarak sekolah resmi %s km',
                $this->panelNumber($detail['jarakSekolahKm']),
            ),
        ];

        foreach ($expectedContexts as $category => $expectedContext) {
            $recommendations = $this->getJson(
                "/api/v1/regions/desa/3301012001/recommendations?bidang={$category}&budget=3000000&people=4&duration=14",
            )
                ->assertOk()
                ->assertJsonPath('data.ai_available', false)
                ->json('data.recommendations');

            foreach ($recommendations as $recommendation) {
                $this->assertStringContainsString(
                    $expectedContext,
                    $recommendation['explanation'],
                    "Template untuk kategori {$category} harus memakai angka dari detail desa.",
                );
            }
        }
    }

    public function test_ai_recommendations_reject_non_integer_people(): void
    {
        $this->assertInvalidAiRecommendationsFallBack(['people' => 4.5]);
    }

    public function test_ai_recommendations_reject_non_integer_duration(): void
    {
        $this->assertInvalidAiRecommendationsFallBack(['duration' => 14.5]);
    }

    public function test_ai_recommendations_reject_budget_max_over_one_hundred_times_budget_min(): void
    {
        $this->assertInvalidAiRecommendationsFallBack(['budget_max' => 100000001]);
    }

    public function test_ai_recommendations_reject_titles_over_120_characters(): void
    {
        $this->assertInvalidAiRecommendationsFallBack(['title' => str_repeat('T', 121)]);
    }

    public function test_ai_recommendations_reject_summaries_over_300_characters(): void
    {
        $this->assertInvalidAiRecommendationsFallBack(['summary' => str_repeat('S', 301)]);
    }

    public function test_ai_recommendations_reject_explanations_over_400_characters(): void
    {
        $this->assertInvalidAiRecommendationsFallBack(['explanation' => str_repeat('E', 401)]);
    }

    public function test_identical_explanation_uses_template_for_only_that_dataset_item(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        Http::fake([
            'https://gemini.test/generate' => fn ($request) => $this->geminiResponse(
                $request,
                fn (array $item, int $index): string => $index === 0
                    ? $item['description']
                    : "Penjelasan Gemini berbeda {$index}.",
            ),
        ]);

        $response = $this->getJson('/api/v1/regions/desa/3301012001/recommendations?bidang=internet&budget=3000000&people=4&duration=14');
        $response->assertOk()->assertJsonPath('data.ai_available', true);

        $dataset = array_slice($response->json('data.recommendations'), 0, 3);
        $this->assertNotSame($dataset[0]['description'], $dataset[0]['explanation']);
        $this->assertStringContainsString('Kegiatan ini relevan dengan', $dataset[0]['explanation']);
        $this->assertSame('Penjelasan Gemini berbeda 1.', $dataset[1]['explanation']);
        $this->assertSame('Penjelasan Gemini berbeda 2.', $dataset[2]['explanation']);
    }

    public function test_all_identical_dataset_explanations_use_templates(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        Http::fake([
            'https://gemini.test/generate' => fn ($request) => $this->geminiResponse(
                $request,
                fn (array $item): string => $item['description'],
            ),
        ]);

        $response = $this->getJson('/api/v1/regions/desa/3301012001/recommendations?bidang=internet&budget=3000000&people=4&duration=14');
        $response->assertOk()->assertJsonPath('data.ai_available', true);

        foreach (array_slice($response->json('data.recommendations'), 0, 3) as $item) {
            $this->assertNotSame($item['description'], $item['explanation']);
            $this->assertStringContainsString('Kegiatan ini relevan dengan', $item['explanation']);
        }
    }

    public function test_similar_dataset_explanation_uses_template(): void
    {
        $description = 'Program literasi digital membantu warga menggunakan internet secara aman dan bertanggung jawab.';
        $nearDuplicate = str_replace('dan bertanggung jawab', 'serta bertanggung jawab', $description);
        similar_text($description, $nearDuplicate, $similarity);
        $this->assertGreaterThan(85, $similarity);

        DB::table('activities')->where('category', 'internet')->update([
            'description' => $description,
        ]);
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        Http::fake([
            'https://gemini.test/generate' => fn ($request) => $this->geminiResponse(
                $request,
                fn (array $item, int $index): string => $index === 0
                    ? str_replace('dan bertanggung jawab', 'serta bertanggung jawab', $item['description'])
                    : "Penjelasan Gemini berbeda {$index}.",
            ),
        ]);

        $response = $this->getJson('/api/v1/regions/desa/3301012001/recommendations?bidang=internet&budget=3000000&people=4&duration=14');
        $response->assertOk()->assertJsonPath('data.ai_available', true);

        $dataset = array_slice($response->json('data.recommendations'), 0, 3);
        $this->assertStringContainsString('Kegiatan ini relevan dengan', $dataset[0]['explanation']);
        $this->assertSame('Penjelasan Gemini berbeda 1.', $dataset[1]['explanation']);
        $this->assertSame('Penjelasan Gemini berbeda 2.', $dataset[2]['explanation']);
    }

    public function test_normalized_description_contained_in_explanation_uses_template(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        Http::fake([
            'https://gemini.test/generate' => fn ($request) => $this->geminiResponse(
                $request,
                fn (array $item, int $index): string => $index === 0
                    ? '  '.mb_strtoupper($item['description'])."  relevan untuk desa  "
                    : "Penjelasan Gemini berbeda {$index}.",
            ),
        ]);

        $response = $this->getJson('/api/v1/regions/desa/3301012001/recommendations?bidang=internet&budget=3000000&people=4&duration=14');
        $response->assertOk()->assertJsonPath('data.ai_available', true);

        $dataset = array_slice($response->json('data.recommendations'), 0, 3);
        $this->assertStringContainsString('Kegiatan ini relevan dengan', $dataset[0]['explanation']);
        $this->assertSame('Penjelasan Gemini berbeda 1.', $dataset[1]['explanation']);
        $this->assertSame('Penjelasan Gemini berbeda 2.', $dataset[2]['explanation']);
    }

    public function test_valid_dataset_explanations_are_used_unchanged(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        Http::fake([
            'https://gemini.test/generate' => fn ($request) => $this->geminiResponse(
                $request,
                fn (array $item, int $index): string => "Penjelasan Gemini valid {$index}.",
            ),
        ]);

        $response = $this->getJson('/api/v1/regions/desa/3301012001/recommendations?bidang=internet&budget=3000000&people=4&duration=14');
        $response->assertOk()->assertJsonPath('data.ai_available', true);

        $dataset = array_slice($response->json('data.recommendations'), 0, 3);
        foreach ($dataset as $index => $item) {
            $this->assertSame("Penjelasan Gemini valid {$index}.", $item['explanation']);
        }
    }

    public function test_partial_template_fallback_is_retried_after_six_minutes(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        $attempts = 0;
        Http::fake([
            'https://gemini.test/generate' => function ($request) use (&$attempts) {
                $attempts++;

                return $this->geminiResponse(
                    $request,
                    fn (array $item, int $index): string => $attempts === 1 && $index === 0
                        ? $item['description']
                        : "Penjelasan Gemini percobaan {$attempts} item {$index}.",
                );
            },
        ]);
        $url = '/api/v1/regions/desa/3301012001/recommendations?bidang=internet&budget=3000000&people=4&duration=14';

        $this->getJson($url)->assertOk()->assertJsonPath('data.ai_available', true);
        $this->travel(6)->minutes();

        $response = $this->getJson($url)->assertOk()->assertJsonPath('data.ai_available', true);
        $this->assertSame(2, $attempts);
        $this->assertSame(
            'Penjelasan Gemini percobaan 2 item 0.',
            $response->json('data.recommendations.0.explanation'),
        );
    }

    public function test_all_valid_dataset_explanations_remain_cached_for_six_hours(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        $attempts = 0;
        Http::fake([
            'https://gemini.test/generate' => function ($request) use (&$attempts) {
                $attempts++;

                return $this->geminiResponse(
                    $request,
                    fn (array $item, int $index): string => "Penjelasan Gemini valid {$index}.",
                );
            },
        ]);
        $url = '/api/v1/regions/desa/3301012001/recommendations?bidang=internet&budget=3000000&people=4&duration=14';

        $this->getJson($url)->assertOk()->assertJsonPath('data.ai_available', true);
        $this->travel(6)->minutes();
        $this->getJson($url)->assertOk()->assertJsonPath('data.ai_available', true);
        $this->assertSame(1, $attempts);

        $this->travel(5)->hours();
        $this->travel(55)->minutes();
        $this->getJson($url)->assertOk()->assertJsonPath('data.ai_available', true);
        $this->assertSame(2, $attempts);
    }

    public function test_invalid_dataset_explanation_lists_keep_structural_fallback(): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        $variants = ['missing', 'empty', 'wrong-id', 'wrong-count'];
        $attempts = 0;
        Http::fake([
            'https://gemini.test/generate' => function ($request) use (&$attempts, $variants) {
                $variant = $variants[$attempts++];

                return $this->geminiResponse(
                    $request,
                    $variant === 'empty'
                        ? fn (array $item): string => ''
                        : null,
                    $variant,
                );
            },
        ]);

        foreach ($variants as $index => $variant) {
            $response = $this->getJson(
                '/api/v1/regions/desa/3301012001/recommendations?bidang=internet&budget='.(3000000 + $index).'&people=4&duration=14',
            );
            $response->assertOk()->assertJsonPath('data.ai_available', false);

            $items = $response->json('data.recommendations');
            $this->assertCount(3, $items);
            foreach ($items as $item) {
                $this->assertNotSame($item['description'], $item['explanation']);
            }
        }

        $this->assertSame(count($variants), $attempts);
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

    public function test_gemini_fallback_is_cached_for_five_minutes_then_retried(): void
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
        $this->travel(4)->minutes();
        $this->getJson($url)
            ->assertOk()
            ->assertJsonPath('data.ai_available', false)
            ->assertJsonCount(3, 'data.recommendations');

        $this->assertSame(1, $attempts);

        $this->travel(2)->minutes();
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

    private function geminiResponse(
        $request,
        ?callable $datasetExplanation = null,
        string $datasetExplanationVariant = 'valid',
        array $aiRecommendationOverrides = [],
    )
    {
        $prompt = $request['contents'][0]['parts'][0]['text'];
        preg_match('/Kegiatan dataset terpilih.*?: (\[.*\])\nKategori saran AI yang harus dipakai berurutan: (\[.*\])$/s', $prompt, $matches);
        $dataset = json_decode($matches[1] ?? '[]', true);
        $categories = json_decode($matches[2] ?? '[]', true);
        $datasetExplanations = array_map(
            fn (array $item, int $index): array => [
                'activity_id' => $datasetExplanationVariant === 'wrong-id'
                    ? $item['activity_id'] + 100000
                    : $item['activity_id'],
                'explanation' => $datasetExplanation === null
                    ? 'Kegiatan relevan dengan kondisi indikator desa.'
                    : $datasetExplanation($item, $index),
            ],
            $dataset,
            array_keys($dataset),
        );

        if ($datasetExplanationVariant === 'wrong-count') {
            array_pop($datasetExplanations);
        }

        $generated = [
            'ai_recommendations' => array_map(
                fn (string $category, int $index): array => array_merge([
                    'category' => $category,
                    'title' => 'Saran tambahan '.$category.' '.$index,
                    'summary' => 'Kegiatan tambahan sesuai kebutuhan lokal.',
                    'explanation' => 'Saran ini menanggapi indikator desa yang tersedia.',
                    'budget_min' => 1000000,
                    'budget_max' => 2000000,
                    'people' => 4,
                    'duration' => 14,
                ], $aiRecommendationOverrides),
                $categories,
                array_keys($categories),
            ),
        ];

        if ($datasetExplanationVariant !== 'missing') {
            $generated['dataset_explanations'] = $datasetExplanations;
        }

        return Http::response([
            'candidates' => [[
                'content' => [
                    'parts' => [[
                        'text' => json_encode($generated),
                    ]],
                ],
            ]],
        ]);
    }

    private function assertInvalidAiRecommendationsFallBack(array $overrides): void
    {
        config([
            'services.gemini.key' => 'test-key',
            'services.gemini.url' => 'https://gemini.test/generate',
        ]);
        Http::fake([
            'https://gemini.test/generate' => fn ($request) => $this->geminiResponse(
                $request,
                null,
                'valid',
                $overrides,
            ),
        ]);

        $this->getJson('/api/v1/regions/desa/3301012001/recommendations?bidang=pendidikan&budget=3000000&people=4&duration=14')
            ->assertOk()
            ->assertJsonPath('data.ai_available', false)
            ->assertJsonCount(3, 'data.recommendations')
            ->assertJsonPath('data.recommendations.0.source', 'dataset');
    }

    private function panelNumber(float|int $value): string
    {
        $formatted = number_format((float) $value, 2, ',', '.');

        return rtrim(rtrim($formatted, '0'), ',');
    }
}
