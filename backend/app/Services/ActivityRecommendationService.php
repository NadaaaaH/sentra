<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Desa;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use JsonException;
use UnexpectedValueException;

class ActivityRecommendationService
{
    private const CATEGORY_LABELS = [
        'kesehatan' => 'Kesehatan',
        'pendidikan' => 'Pendidikan',
        'internet' => 'Akses Internet',
        'infrastruktur' => 'Infrastruktur',
        'ekonomi' => 'Ekonomi',
    ];

    public function generate(Desa $desa, array $context = []): array
    {
        $context = array_intersect_key($context, array_flip(['bidang', 'budget', 'people', 'duration']));
        $cacheKey = 'activity-recommendations:v3:'.hash(
            'sha256',
            json_encode([
                'desa' => (string) $desa->kode_desa,
                'context' => $context,
            ], JSON_THROW_ON_ERROR),
        );

        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return $cached;
        }

        $usedTemplateForDatasetExplanation = false;
        $result = $this->generateRecommendations($desa, $context, $usedTemplateForDatasetExplanation);
        $expiresAt = $result['ai_available'] && ! $usedTemplateForDatasetExplanation
            ? now()->addHours(6)
            : now()->addMinutes(5);
        Cache::put($cacheKey, $result, $expiresAt);

        return $result;
    }

    private function generateRecommendations(
        Desa $desa,
        array $context,
        bool &$usedTemplateForDatasetExplanation,
    ): array
    {
        $activitiesByCategory = $this->availableActivities();
        $rankedCategories = $this->rankCategories($desa);
        $hasSelectedCategory = isset($context['bidang']);

        if ($hasSelectedCategory) {
            $categories = [$context['bidang']];
            $dataset = $this->closestActivities(
                $activitiesByCategory[$context['bidang']] ?? collect(),
                $context,
                3,
            );
            $aiCategories = [$context['bidang'], $context['bidang']];
        } else {
            $categories = $rankedCategories;
            $dataset = $this->variedActivities($activitiesByCategory, $categories);
            $counts = array_count_values(array_column($dataset, 'category'));
            $aiCategories = $this->availableAiCategories($categories, $counts);
        }

        $datasetRecommendations = array_map(
            fn (Activity $activity): array => $this->datasetRecommendation($activity),
            $dataset,
        );
        $fallback = [
            'recommendations' => array_map(
                fn (array $activity): array => [
                    ...$activity,
                    'explanation' => $this->templateExplanation($desa, $activity['category']),
                ],
                $datasetRecommendations,
            ),
            'ai_available' => false,
        ];

        if (count($datasetRecommendations) < 3 || count($aiCategories) < 2) {
            return $fallback;
        }

        $apiKey = config('services.gemini.key');
        if (! is_string($apiKey) || trim($apiKey) === '') {
            return $fallback;
        }

        try {
            $generated = $this->requestGemini($desa, $context, $datasetRecommendations, $aiCategories);
            $datasetExplanations = $this->validateDatasetExplanations(
                $generated,
                $datasetRecommendations,
            );
            $aiRecommendations = $this->validateAiRecommendations(
                $generated,
                $aiCategories,
                $datasetRecommendations,
            );

            foreach ($datasetRecommendations as &$recommendation) {
                $explanation = $datasetExplanations[$recommendation['id']];
                if ($this->repeatsDescription($recommendation['description'], $explanation)) {
                    $recommendation['explanation'] = $this->templateExplanation($desa, $recommendation['category']);
                    $usedTemplateForDatasetExplanation = true;

                    continue;
                }

                $recommendation['explanation'] = $explanation;
            }
            unset($recommendation);

            return [
                'recommendations' => [...$datasetRecommendations, ...$aiRecommendations],
                'ai_available' => true,
            ];
        } catch (ConnectionException|RequestException|JsonException|UnexpectedValueException $exception) {
            Log::warning('Activity recommendations Gemini fallback used.', [
                'desa' => $desa->kode_desa,
                'message' => $exception->getMessage(),
            ]);

            return $fallback;
        }
    }

    private function availableActivities(): array
    {
        return Activity::query()
            ->whereIn('category', array_keys(self::CATEGORY_LABELS))
            ->where('min_budget', '>', 0)
            ->whereColumn('max_budget', '>=', 'min_budget')
            ->where('required_people', '>', 0)
            ->where('duration_days', '>', 0)
            ->orderBy('id')
            ->get()
            ->groupBy('category')
            ->all();
    }

    private function rankCategories(Desa $desa): array
    {
        $scores = [
            'kesehatan' => $this->averageAvailableScores([
                $desa->iks_2024 === null ? null : $this->indexGap((float) $desa->iks_2024),
                $desa->jarak_faskes_fix_km === null
                    ? null
                    : min(max(((float) $desa->jarak_faskes_fix_km / 10) * 100, 0), 100),
            ]),
            'pendidikan' => $desa->jarak_sekolah_resmi_km === null
                ? null
                : min(max(((float) $desa->jarak_sekolah_resmi_km / 5) * 100, 0), 100),
            'internet' => $desa->kecamatan?->kabupaten?->akses_internet_layak_persen === null
                ? null
                : min(max(100 - (float) $desa->kecamatan->kabupaten->akses_internet_layak_persen, 0), 100),
            'infrastruktur' => $this->averageAvailableScores([
                $desa->ikl_2024 === null ? null : $this->indexGap((float) $desa->ikl_2024),
                $desa->kecamatan?->kabupaten?->akses_air_minum_persen === null
                    ? null
                    : min(max(100 - (float) $desa->kecamatan->kabupaten->akses_air_minum_persen, 0), 100),
            ]),
            'ekonomi' => $desa->ike_2024 === null ? null : $this->indexGap((float) $desa->ike_2024),
        ];

        uksort($scores, static fn (string $first, string $second): int => (
            (($scores[$second] ?? -1) <=> ($scores[$first] ?? -1))
            ?: strcmp($first, $second)
        ));

        return array_keys(array_filter(
            $scores,
            static fn (?float $score): bool => $score !== null,
        ));
    }

    private function variedActivities(array $activitiesByCategory, array $categories): array
    {
        $selected = [];
        $counts = [];

        foreach ([1, 2] as $round) {
            foreach ($categories as $category) {
                if (count($selected) >= 3 || ($counts[$category] ?? 0) >= 2) {
                    continue;
                }
                $categoryActivities = $activitiesByCategory[$category] ?? collect();
                $activity = $categoryActivities->values()->get($round - 1);
                if ($activity === null) {
                    continue;
                }

                $selected[] = $activity;
                $counts[$category] = ($counts[$category] ?? 0) + 1;
            }
        }

        return $selected;
    }

    private function closestActivities($activities, array $context, int $limit): array
    {
        if (! isset($context['budget'], $context['people'], $context['duration'])) {
            return $activities->take($limit)->all();
        }

        return $activities
            ->sort(fn (Activity $first, Activity $second): int => (
                ($this->activityDistance($first, $context) <=> $this->activityDistance($second, $context))
                ?: ($first->id <=> $second->id)
            ))
            ->take($limit)
            ->values()
            ->all();
    }

    private function availableAiCategories(array $categories, array $counts): array
    {
        $selected = [];
        foreach ($categories as $category) {
            $slots = max(0, 2 - ($counts[$category] ?? 0));
            for ($slot = 0; $slot < $slots && count($selected) < 2; $slot++) {
                $selected[] = $category;
            }
        }

        return $selected;
    }

    private function activityDistance(Activity $activity, array $context): float
    {
        $durationScale = max(1, (int) $context['duration'] / (int) $activity->duration_days);
        $minimumBudget = (float) $activity->min_budget * $durationScale;
        $maximumBudget = (float) $activity->max_budget * $durationScale;
        $budget = (float) $context['budget'];
        $budgetDistance = match (true) {
            $budget < $minimumBudget => ($minimumBudget - $budget) / $minimumBudget,
            $budget > $maximumBudget => ($budget - $maximumBudget) / max($maximumBudget, 1),
            default => 0,
        };
        $peopleDistance = abs((int) $context['people'] - (int) $activity->required_people)
            / max((int) $activity->required_people, 1);
        $durationDistance = abs((int) $context['duration'] - (int) $activity->duration_days)
            / max((int) $activity->duration_days, 1);

        return ($budgetDistance * 0.5) + ($peopleDistance * 0.25) + ($durationDistance * 0.25);
    }

    private function datasetRecommendation(Activity $activity): array
    {
        return [
            'id' => (int) $activity->id,
            'source' => 'dataset',
            'title' => $activity->title,
            'category' => $activity->category,
            'description' => $activity->description,
            'explanation' => '',
            'budget_min' => (int) $activity->min_budget,
            'budget_max' => (int) $activity->max_budget,
            'people' => (int) $activity->required_people,
            'duration' => (int) $activity->duration_days,
            'file_url' => null,
            'kabupaten' => null,
            'desa' => null,
        ];
    }

    private function requestGemini(
        Desa $desa,
        array $context,
        array $datasetRecommendations,
        array $aiCategories,
    ): array {
        $response = Http::withHeaders(['x-goog-api-key' => config('services.gemini.key')])
            ->timeout(30)
            ->post(config('services.gemini.url'), [
                'systemInstruction' => [
                    'parts' => [[
                        'text' => 'Kamu membantu menyusun rekomendasi kegiatan untuk desa. Balas JSON saja sesuai skema. Untuk setiap kegiatan dataset, explanation harus menjelaskan mengapa kegiatan itu relevan dengan kondisi desa ini, dengan menyebut indikator dan angka yang tersedia dalam konteks. Maksimal dua kalimat. DILARANG menyalin, mengulang, atau memparafrase description kegiatan. Contoh format benar: description="Layanan kesehatan keliling"; health_facility_distance_km=10; explanation="Fasilitas kesehatan terdekat berjarak 10 km, sehingga kegiatan ini relevan untuk memperluas akses warga yang jauh dari layanan." Untuk saran AI, buat judul, ringkasan, penjelasan, dan perkiraan anggaran, jumlah pelaksana, durasi yang masuk akal. Gunakan hanya indikator yang diberikan. Jangan mengarang link, nama desa, atau angka indikator yang tidak diberikan. Jangan menduplikasi judul kegiatan dataset atau saran AI lain.',
                    ]],
                ],
                'contents' => [[
                    'parts' => [[
                        'text' => $this->promptContext($desa, $context, $datasetRecommendations, $aiCategories),
                    ]],
                ]],
                'generationConfig' => [
                    'temperature' => 0.3,
                    'responseMimeType' => 'application/json',
                    'responseSchema' => [
                        'type' => 'OBJECT',
                        'properties' => [
                            'dataset_explanations' => [
                                'type' => 'ARRAY',
                                'items' => [
                                    'type' => 'OBJECT',
                                    'properties' => [
                                        'activity_id' => ['type' => 'INTEGER'],
                                        'explanation' => ['type' => 'STRING'],
                                    ],
                                    'required' => ['activity_id', 'explanation'],
                                ],
                            ],
                            'ai_recommendations' => [
                                'type' => 'ARRAY',
                                'items' => [
                                    'type' => 'OBJECT',
                                    'properties' => [
                                        'category' => ['type' => 'STRING', 'enum' => array_values(array_unique($aiCategories))],
                                        'title' => ['type' => 'STRING'],
                                        'summary' => ['type' => 'STRING'],
                                        'explanation' => ['type' => 'STRING'],
                                        'budget_min' => ['type' => 'INTEGER'],
                                        'budget_max' => ['type' => 'INTEGER'],
                                        'people' => ['type' => 'INTEGER'],
                                        'duration' => ['type' => 'INTEGER'],
                                    ],
                                    'required' => [
                                        'category',
                                        'title',
                                        'summary',
                                        'explanation',
                                        'budget_min',
                                        'budget_max',
                                        'people',
                                        'duration',
                                    ],
                                ],
                            ],
                        ],
                        'required' => ['dataset_explanations', 'ai_recommendations'],
                    ],
                ],
            ]);

        $response->throw();
        $text = $response->json('candidates.0.content.parts.0.text');
        if (! is_string($text)) {
            throw new UnexpectedValueException('Gemini tidak mengembalikan teks JSON.');
        }

        $generated = json_decode($text, true, 512, JSON_THROW_ON_ERROR);
        if (! is_array($generated)) {
            throw new UnexpectedValueException('Gemini tidak mengembalikan objek JSON.');
        }

        return $generated;
    }

    private function promptContext(
        Desa $desa,
        array $context,
        array $datasetRecommendations,
        array $aiCategories,
    ): string {
        $kabupaten = $desa->kecamatan?->kabupaten;
        $indicators = [
            'iks_2024' => $desa->iks_2024,
            'ike_2024' => $desa->ike_2024,
            'ikl_2024' => $desa->ikl_2024,
            'school_distance_km' => $desa->jarak_sekolah_resmi_km,
            'health_facility_distance_km' => $desa->jarak_faskes_fix_km,
            'internet_coverage_percent' => $kabupaten?->akses_internet_layak_persen,
            'drinking_water_access_percent' => $kabupaten?->akses_air_minum_persen,
        ];

        return 'Konteks pengguna: '.json_encode($context, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n"
            .'Indikator dan kondisi desa: '.json_encode($indicators, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n"
            .'Kegiatan dataset terpilih (jangan ubah datanya): '.json_encode(array_map(
                static fn (array $item): array => [
                    'activity_id' => $item['id'],
                    'title' => $item['title'],
                    'category' => $item['category'],
                    'description' => $item['description'],
                    'budget_min' => $item['budget_min'],
                    'budget_max' => $item['budget_max'],
                    'people' => $item['people'],
                    'duration' => $item['duration'],
                ],
                $datasetRecommendations,
            ), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n"
            .'Kategori saran AI yang harus dipakai berurutan: '.json_encode($aiCategories, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }

    private function validateDatasetExplanations(array $generated, array $dataset): array
    {
        $items = $generated['dataset_explanations'] ?? null;
        if (! is_array($items) || count($items) !== count($dataset)) {
            throw new UnexpectedValueException('Jumlah penjelasan dataset Gemini tidak valid.');
        }

        $expectedIds = array_column($dataset, 'id');
        $explanations = [];
        foreach ($items as $item) {
            if (! is_array($item)
                || ! isset($item['activity_id'], $item['explanation'])
                || ! is_numeric($item['activity_id'])
                || ! is_string($item['explanation'])
                || trim($item['explanation']) === ''
            ) {
                throw new UnexpectedValueException('Penjelasan kegiatan dataset Gemini tidak valid.');
            }

            $id = (int) $item['activity_id'];
            if (! in_array($id, $expectedIds, true) || isset($explanations[$id])) {
                throw new UnexpectedValueException('Gemini mengembalikan id kegiatan yang tidak dipilih.');
            }
            $explanations[$id] = trim($item['explanation']);
        }

        return $explanations;
    }

    private function repeatsDescription(string $description, string $explanation): bool
    {
        $normalizedDescription = $this->normalizeExplanationText($description);
        if ($normalizedDescription === '') {
            return false;
        }

        $normalizedExplanation = $this->normalizeExplanationText($explanation);
        if ($normalizedExplanation === $normalizedDescription
            || str_contains($normalizedExplanation, $normalizedDescription)
        ) {
            return true;
        }

        similar_text($normalizedDescription, $normalizedExplanation, $similarity);

        return $similarity > 85;
    }

    private function normalizeExplanationText(string $text): string
    {
        $lowercase = mb_strtolower(trim($text));

        return preg_replace('/\s+/u', ' ', $lowercase) ?? $lowercase;
    }

    private function validateAiRecommendations(
        array $generated,
        array $categories,
        array $dataset,
    ): array {
        $items = $generated['ai_recommendations'] ?? null;
        if (! is_array($items) || count($items) !== 2) {
            throw new UnexpectedValueException('Gemini harus mengembalikan dua saran AI.');
        }

        $datasetTitles = array_map(
            static fn (array $item): string => mb_strtolower(trim($item['title'])),
            $dataset,
        );
        $titles = $datasetTitles;
        $recommendations = [];
        foreach ($items as $index => $item) {
            if (! is_array($item)
                || ! isset(
                    $item['category'],
                    $item['title'],
                    $item['summary'],
                    $item['explanation'],
                    $item['budget_min'],
                    $item['budget_max'],
                    $item['people'],
                    $item['duration'],
                )
                || ! is_string($item['category'])
                || $item['category'] !== $categories[$index]
                || ! is_string($item['title'])
                || ! is_string($item['summary'])
                || ! is_string($item['explanation'])
                || trim($item['title']) === ''
                || trim($item['summary']) === ''
                || trim($item['explanation']) === ''
                || ! is_numeric($item['budget_min'])
                || ! is_numeric($item['budget_max'])
                || ! is_numeric($item['people'])
                || ! is_numeric($item['duration'])
                || (float) $item['budget_min'] < 0
                || (float) $item['budget_max'] < (float) $item['budget_min']
                || (int) $item['people'] < 1
                || (int) $item['duration'] < 1
            ) {
                throw new UnexpectedValueException('Saran AI Gemini tidak valid.');
            }

            $normalizedTitle = mb_strtolower(trim($item['title']));
            if (in_array($normalizedTitle, $titles, true)) {
                throw new UnexpectedValueException('Saran AI menduplikasi judul kegiatan.');
            }
            $titles[] = $normalizedTitle;
            $recommendations[] = [
                'source' => 'ai',
                'title' => trim($item['title']),
                'category' => $item['category'],
                'description' => trim($item['summary']),
                'explanation' => trim($item['explanation']),
                'budget_min' => (int) $item['budget_min'],
                'budget_max' => (int) $item['budget_max'],
                'people' => (int) $item['people'],
                'duration' => (int) $item['duration'],
                'file_url' => null,
                'kabupaten' => null,
                'desa' => null,
            ];
        }

        return $recommendations;
    }

    private function templateExplanation(Desa $desa, string $category): string
    {
        $kabupaten = $desa->kecamatan?->kabupaten;
        $context = match ($category) {
            'kesehatan' => $desa->jarak_faskes_fix_km === null
                ? 'indikator kesehatan desa yang tersedia'
                : sprintf('jarak fasilitas kesehatan %.1f km', $desa->jarak_faskes_fix_km),
            'pendidikan' => $desa->jarak_sekolah_resmi_km === null
                ? 'data akses pendidikan yang tersedia'
                : sprintf('jarak sekolah resmi %.1f km', $desa->jarak_sekolah_resmi_km),
            'internet' => $kabupaten?->akses_internet_layak_persen === null
                ? 'data akses internet wilayah yang tersedia'
                : sprintf('akses internet layak kabupaten %.1f%%', $kabupaten->akses_internet_layak_persen),
            'infrastruktur' => $this->infrastructureSummary($desa),
            'ekonomi' => $desa->ike_2024 === null
                ? 'data ekonomi desa yang tersedia'
                : sprintf('indeks ekonomi desa %.2f', $desa->ike_2024),
            default => 'indikator wilayah yang tersedia',
        };

        return "Kegiatan ini relevan dengan {$context} yang tercatat untuk desa.";
    }

    private function infrastructureSummary(Desa $desa): string
    {
        $kabupaten = $desa->kecamatan?->kabupaten;
        $indicators = [];
        if ($desa->ikl_2024 !== null) {
            $indicators[] = sprintf('indeks kualitas lahan %.2f', $desa->ikl_2024);
        }
        if ($kabupaten?->akses_air_minum_persen !== null) {
            $indicators[] = sprintf('akses air minum kabupaten %.1f%%', $kabupaten->akses_air_minum_persen);
        }

        return $indicators === [] ? 'data infrastruktur wilayah yang tersedia' : implode(' dan ', $indicators);
    }

    private function indexGap(float $index): float
    {
        return min(max((1 - $index) * 100, 0), 100);
    }

    private function averageAvailableScores(array $scores): ?float
    {
        $scores = array_filter($scores, static fn (?float $score): bool => $score !== null);

        return $scores === [] ? null : array_sum($scores) / count($scores);
    }
}
