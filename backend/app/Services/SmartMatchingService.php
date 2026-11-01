<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Desa;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use JsonException;
use UnexpectedValueException;

class SmartMatchingService
{
    private const CATEGORY_LABELS = [
        'kesehatan' => 'Kesehatan',
        'pendidikan' => 'Pendidikan',
        'internet' => 'Akses Internet',
        'infrastruktur' => 'Infrastruktur',
        'ekonomi' => 'Ekonomi',
    ];

    public function availableProgramCategories(): array
    {
        $categories = Activity::query()
            ->whereIn('category', array_keys(self::CATEGORY_LABELS))
            ->where('min_budget', '>', 0)
            ->whereColumn('max_budget', '>=', 'min_budget')
            ->where('required_people', '>', 0)
            ->where('duration_days', '>', 0)
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return $categories
            ->filter(fn (string $category): bool => $this->hasIndicatorData($category))
            ->map(fn (string $category): array => [
                'value' => $category,
                'label' => self::CATEGORY_LABELS[$category],
            ])
            ->values()
            ->all();
    }

    public function processSmartMatching(array $input): array
    {
        $activities = $this->programActivities($input['bidang']);
        if ($activities->isEmpty()) {
            return [
                'matches' => [],
                'message' => 'Belum ada acuan aktivitas dengan rentang anggaran, jumlah pelaksana, dan durasi yang valid untuk bidang ini.',
            ];
        }

        $durationFeasibleActivities = $activities
            ->filter(fn (Activity $activity): bool => (int) $activity->duration_days <= (int) $input['durasi']);

        if ($durationFeasibleActivities->isEmpty()) {
            $nearestDuration = (int) $activities->min('duration_days');
            $shortestActivity = $activities->firstWhere('duration_days', $nearestDuration);

            return [
                'matches' => [],
                'message' => sprintf(
                    'Durasi %d hari belum memungkinkan untuk aktivitas di bidang ini. Durasi terpendek pada acuan adalah %d hari (%s). Tambah durasi atau sesuaikan cakupan program.',
                    (int) $input['durasi'],
                    $nearestDuration,
                    $shortestActivity->title,
                ),
            ];
        }

        $requirements = $this->closestActivity($durationFeasibleActivities, $input);
        $query = Desa::query()
            ->select([
                'kode_desa',
                'kode_kec',
                'nama_desa',
                'unit_type',
                'iks_2024',
                'ike_2024',
                'ikl_2024',
                'jarak_sekolah_resmi_km',
                'jarak_faskes_fix_km',
            ])
            ->with([
                'kecamatan:kode_kec,kode_kab,nama_kecamatan',
                'kecamatan.kabupaten:kode_kab,nama_kabupaten,akses_air_minum_persen,akses_internet_layak_persen',
            ]);

        match ($input['bidang']) {
            'kesehatan' => $query->where(function ($query): void {
                $query->whereNotNull('iks_2024')
                    ->orWhereNotNull('jarak_faskes_fix_km');
            }),
            'pendidikan' => $query->whereNotNull('jarak_sekolah_resmi_km'),
            'internet' => $query->whereHas(
                'kecamatan.kabupaten',
                fn ($query) => $query->whereNotNull('akses_internet_layak_persen'),
            ),
            'infrastruktur' => $query->where(function ($query): void {
                $query->whereNotNull('ikl_2024')
                    ->orWhereHas(
                        'kecamatan.kabupaten',
                        fn ($query) => $query->whereNotNull('akses_air_minum_persen'),
                    );
            }),
            'ekonomi' => $query->whereNotNull('ike_2024'),
        };

        $candidates = $query
            ->get()
            ->map(fn (Desa $desa): ?array => $this->scoreCandidate($desa, $input, $requirements))
            ->filter()
            ->sortByDesc('match_score')
            ->take(5)
            ->values()
            ->all();

        if ($candidates === []) {
            return [
                'matches' => [],
                'message' => 'Belum ada wilayah dengan data indikator yang cukup untuk bidang ini.',
            ];
        }

        return [
            'matches' => $this->addAiExplanations($input, $requirements, $candidates),
            'message' => 'Berhasil mencocokkan program dengan wilayah target',
        ];
    }

    private function programActivities(string $category): Collection
    {
        $activities = Activity::query()
            ->where('category', $category)
            ->where('min_budget', '>', 0)
            ->whereColumn('max_budget', '>=', 'min_budget')
            ->where('required_people', '>', 0)
            ->where('duration_days', '>', 0)
            ->get();

        if ($activities->isEmpty() && Activity::query()->where('category', $category)->exists()) {
            Log::warning('Smart Matching found no valid activity resource ranges.', [
                'category' => $category,
            ]);
        }

        return $activities;
    }

    private function hasIndicatorData(string $category): bool
    {
        return match ($category) {
            'kesehatan' => Desa::query()
                ->whereNotNull('iks_2024')
                ->orWhereNotNull('jarak_faskes_fix_km')
                ->exists(),
            'pendidikan' => Desa::query()->whereNotNull('jarak_sekolah_resmi_km')->exists(),
            'internet' => Desa::query()
                ->whereHas(
                    'kecamatan.kabupaten',
                    fn ($query) => $query->whereNotNull('akses_internet_layak_persen'),
                )
                ->exists(),
            'infrastruktur' => Desa::query()
                ->where(function ($query): void {
                    $query->whereNotNull('ikl_2024')
                        ->orWhereHas(
                            'kecamatan.kabupaten',
                            fn ($query) => $query->whereNotNull('akses_air_minum_persen'),
                        );
                })
                ->exists(),
            'ekonomi' => Desa::query()->whereNotNull('ike_2024')->exists(),
            default => false,
        };
    }

    private function closestActivity(Collection $activities, array $input): Activity
    {
        return $activities
            ->sortBy(fn (Activity $activity): float => $this->activityDistance($activity, $input))
            ->first();
    }

    private function activityDistance(Activity $activity, array $input): float
    {
        $budget = (float) $input['anggaran'];
        $minimumBudget = (float) $activity->min_budget;
        $maximumBudget = (float) $activity->max_budget;
        $budgetDistance = match (true) {
            $budget < $minimumBudget => ($minimumBudget - $budget) / $minimumBudget,
            $budget > $maximumBudget => ($budget - $maximumBudget) / max($maximumBudget, 1),
            default => 0,
        };
        $peopleDistance = abs((int) $input['pelaksana'] - (int) $activity->required_people)
            / max((int) $activity->required_people, 1);
        $durationDistance = abs((int) $input['durasi'] - (int) $activity->duration_days)
            / max((int) $activity->duration_days, 1);

        return ($budgetDistance * 0.5) + ($peopleDistance * 0.25) + ($durationDistance * 0.25);
    }

    private function scoreCandidate(Desa $desa, array $input, Activity $requirements): ?array
    {
        $urgensiBidang = $this->sectorUrgency($desa, $input['bidang']);

        if ($urgensiBidang === null) {
            return null;
        }

        $budget = (float) $input['anggaran'];
        $skorAnggaran = $budget < $requirements->min_budget
            ? ($budget / $requirements->min_budget) * 100
            : 100;
        $skorPelaksana = min(((int) $input['pelaksana'] / $requirements->required_people) * 100, 100);
        $skorDurasi = 100;
        $skorKapasitas = ($skorAnggaran * 0.5) + ($skorPelaksana * 0.25) + ($skorDurasi * 0.25);
        $resourcesMeetMinimum = $budget >= $requirements->min_budget
            && (int) $input['pelaksana'] >= $requirements->required_people;
        $matchScore = (int) round(($urgensiBidang * 0.6) + ($skorKapasitas * 0.4));
        $kecamatan = $desa->kecamatan;
        $kabupaten = $kecamatan?->kabupaten;

        return [
            'region_id' => (string) $desa->kode_desa,
            'village_name' => ucfirst($desa->unit_type).' '.mb_convert_case($desa->nama_desa, MB_CASE_TITLE, 'UTF-8'),
            'district_name' => $kecamatan?->nama_kecamatan ?? '-',
            'match_score' => $matchScore,
            'urgency_level' => $this->urgencyLabel($urgensiBidang),
            'feasibility_status' => $this->feasibilityLabel($skorKapasitas, $resourcesMeetMinimum),
            'match_reason' => $this->fallbackReason(
                $desa,
                $input,
                $urgensiBidang,
                $requirements,
            ),
            'recommended_action' => $this->fallbackAction($input, $requirements, $skorKapasitas, $skorAnggaran),
            'scoring_context' => [
                'urgency_score' => (int) round($urgensiBidang),
                'sector_urgency_score' => (int) round($urgensiBidang),
                'capacity_score' => (int) round($skorKapasitas),
                'budget_score' => (int) round($skorAnggaran),
                'minimum_budget' => $requirements->min_budget,
                'maximum_budget' => $requirements->max_budget,
                'activity_title' => $requirements->title,
                'health_index_gap_percent' => $desa->iks_2024 === null
                    ? null
                    : round($this->indexGap((float) $desa->iks_2024), 2),
                'land_quality_gap_percent' => $desa->ikl_2024 === null
                    ? null
                    : round($this->indexGap((float) $desa->ikl_2024), 2),
                'economic_gap_percent' => $desa->ike_2024 === null
                    ? null
                    : round($this->indexGap((float) $desa->ike_2024), 2),
                'drinking_water_gap_percent' => $kabupaten?->akses_air_minum_persen === null
                    ? null
                    : round(100 - (float) $kabupaten->akses_air_minum_persen, 2),
                'health_distance_km' => $desa->jarak_faskes_fix_km,
                'school_distance_km' => $desa->jarak_sekolah_resmi_km,
                'internet_coverage_percent' => $kabupaten?->akses_internet_layak_persen,
            ],
        ];
    }

    private function sectorUrgency(Desa $desa, string $category): ?float
    {
        return match ($category) {
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
            default => null,
        };
    }

    private function indexGap(float $index): float
    {
        return min(max((1 - $index) * 100, 0), 100);
    }

    private function averageAvailableScores(array $scores): ?float
    {
        $scores = array_filter($scores, fn (?float $score): bool => $score !== null);

        return $scores === [] ? null : array_sum($scores) / count($scores);
    }

    private function urgencyLabel(float $score): string
    {
        return match (true) {
            $score >= 75 => 'Sangat Tinggi',
            $score >= 50 => 'Tinggi',
            $score >= 25 => 'Sedang',
            default => 'Rendah',
        };
    }

    private function feasibilityLabel(float $score, bool $resourcesMeetMinimum): string
    {
        if (! $resourcesMeetMinimum && $score >= 60) {
            return 'Layak dengan Penyesuaian';
        }

        return match (true) {
            $score >= 80 => 'Sangat Layak',
            $score >= 60 => 'Layak',
            $score >= 35 => 'Layak dengan Penyesuaian',
            default => 'Perlu Penyesuaian',
        };
    }

    private function fallbackReason(
        Desa $desa,
        array $input,
        float $urgency,
        Activity $requirements,
    ): string {
        $field = match ($input['bidang']) {
            'kesehatan' => 'indikator kesehatan dan akses fasilitas kesehatan',
            'pendidikan' => 'akses sekolah',
            'internet' => 'akses internet kabupaten',
            'infrastruktur' => 'kualitas lahan dan akses air minum kabupaten',
            'ekonomi' => 'indikator kondisi ekonomi',
        };
        $distance = match ($input['bidang']) {
            'kesehatan' => $desa->jarak_faskes_fix_km,
            'pendidikan' => $desa->jarak_sekolah_resmi_km,
            default => null,
        };
        $evidence = $distance === null
            ? "{$field} menunjukkan kebutuhan sekitar {$this->urgencyLabel($urgency)}"
            : "jarak {$field} mencapai {$distance} km";
        $indicatorEvidence = match ($input['bidang']) {
            'kesehatan' => $desa->iks_2024 === null
                ? ''
                : sprintf(' Kesenjangan indikator kesehatan sekitar %s%%.', round($this->indexGap((float) $desa->iks_2024), 2)),
            'infrastruktur' => $this->infrastructureEvidence($desa),
            'ekonomi' => $desa->ike_2024 === null
                ? ''
                : sprintf(' Kesenjangan indikator ekonomi sekitar %s%%.', round($this->indexGap((float) $desa->ike_2024), 2)),
            default => '',
        };
        $budgetRange = sprintf(
            'Acuan aktivitas terdekat adalah "%s" dengan rentang anggaran Rp%s–Rp%s',
            $requirements->title,
            number_format($requirements->min_budget, 0, ',', '.'),
            number_format($requirements->max_budget, 0, ',', '.'),
        );

        $budget = match (true) {
            (float) $input['anggaran'] < $requirements->min_budget => 'Anggaran pengguna di bawah batas minimum aktivitas sehingga cakupan perlu disesuaikan',
            (float) $input['anggaran'] > $requirements->max_budget => 'Anggaran pengguna di atas rentang acuan aktivitas, tetapi memenuhi batas minimum',
            default => 'Anggaran pengguna berada dalam rentang acuan aktivitas',
        };

        return "Desa ini diprioritaskan karena {$evidence}.{$indicatorEvidence} {$budgetRange}. {$budget}.";
    }

    private function infrastructureEvidence(Desa $desa): string
    {
        $evidence = '';
        if ($desa->ikl_2024 !== null) {
            $evidence .= sprintf(
                ' Kesenjangan kualitas lahan sekitar %s%%.',
                round($this->indexGap((float) $desa->ikl_2024), 2),
            );
        }

        $waterAccess = $desa->kecamatan?->kabupaten?->akses_air_minum_persen;
        if ($waterAccess !== null) {
            $evidence .= sprintf(
                ' Kesenjangan akses air minum kabupaten sekitar %s%%.',
                round(100 - (float) $waterAccess, 2),
            );
        }

        return $evidence;
    }

    private function fallbackAction(
        array $input,
        Activity $requirements,
        float $capacityScore,
        float $budgetScore,
    ): string {
        $actions = [
            'kesehatan' => 'penyuluhan kesehatan dan pemeriksaan dasar',
            'pendidikan' => 'dukungan kegiatan belajar dan pendampingan siswa',
            'internet' => 'penyediaan akses internet komunitas dan literasi digital',
            'infrastruktur' => 'perbaikan akses fasilitas dasar secara bertahap',
            'ekonomi' => 'penguatan kegiatan ekonomi masyarakat secara bertahap',
        ];

        if ($capacityScore < 60
            || $budgetScore < 100
            || (int) $input['pelaksana'] < $requirements->required_people
        ) {
            return sprintf(
                'Acuan terdekat: "%s". Mulai dengan pilot %s berskala terbatas; anggaran minimum acuannya Rp%s dengan %d pelaksana selama %d hari.',
                $requirements->title,
                $actions[$input['bidang']],
                number_format($requirements->min_budget, 0, ',', '.'),
                $requirements->required_people,
                $requirements->duration_days,
            );
        }

        return sprintf(
            'Acuan terdekat: "%s". Fokuskan %d pelaksana selama %d hari pada %s, dimulai dari kelompok atau lokasi dengan kebutuhan tertinggi.',
            $requirements->title,
            (int) $input['pelaksana'],
            (int) $input['durasi'],
            $actions[$input['bidang']],
        );
    }

    private function addAiExplanations(array $input, Activity $requirements, array $candidates): array
    {
        $apiKey = config('services.gemini.key');

        if (! is_string($apiKey) || trim($apiKey) === '') {
            Log::warning('Smart Matching Gemini fallback used: API key is not configured.');

            return $this->withoutScoringContext($candidates);
        }

        try {
            $response = Http::withHeaders(['x-goog-api-key' => $apiKey])
                ->timeout(15)
                ->post(config('services.gemini.url'), [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $this->aiPrompt($input, $requirements, $candidates)],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.2,
                        'responseMimeType' => 'application/json',
                        'responseSchema' => [
                            'type' => 'OBJECT',
                            'properties' => [
                                'matches' => [
                                    'type' => 'ARRAY',
                                    'items' => [
                                        'type' => 'OBJECT',
                                        'properties' => [
                                            'region_id' => ['type' => 'STRING'],
                                            'match_reason' => ['type' => 'STRING'],
                                            'recommended_action' => ['type' => 'STRING'],
                                        ],
                                        'required' => ['region_id', 'match_reason', 'recommended_action'],
                                    ],
                                ],
                            ],
                            'required' => ['matches'],
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

            $explanations = $this->validatedExplanations($generated, $candidates);

            foreach ($candidates as &$candidate) {
                if (isset($explanations[$candidate['region_id']])) {
                    $candidate['match_reason'] = $explanations[$candidate['region_id']]['match_reason'];
                    $candidate['recommended_action'] = $explanations[$candidate['region_id']]['recommended_action'];
                }
            }
            unset($candidate);

            return $this->withoutScoringContext($candidates);
        } catch (ConnectionException|RequestException|JsonException|UnexpectedValueException $exception) {
            Log::warning('Smart Matching Gemini fallback used.', [
                'message' => $exception->getMessage(),
            ]);

            return $this->withoutScoringContext($candidates);
        }
    }

    private function aiPrompt(array $input, Activity $requirements, array $candidates): string
    {
        $context = array_map(fn (array $candidate): array => [
            'region_id' => $candidate['region_id'],
            'village_name' => $candidate['village_name'],
            'district_name' => $candidate['district_name'],
            'match_score' => $candidate['match_score'],
            'urgency_level' => $candidate['urgency_level'],
            'feasibility_status' => $candidate['feasibility_status'],
            'scoring_context' => $candidate['scoring_context'],
        ], $candidates);

        return "Bertindak sebagai analis dampak sosial spasial SENTRA. Hasilkan alasan kecocokan 1-2 kalimat dan aksi yang realistis untuk setiap kandidat. Gunakan hanya data yang diberikan, jangan mengubah urutan/skor, jangan mengarang nilai atau menjanjikan hasil. Jika anggaran di bawah minimum, sarankan pilot atau pengurangan cakupan. Hubungkan kesehatan dengan indeks kesehatan dan jarak fasilitas kesehatan; pendidikan dengan jarak sekolah; internet dengan kesenjangan akses internet; infrastruktur dengan kualitas lahan dan kesenjangan akses air minum; ekonomi hanya dengan indikator ekonomi yang tersedia. Nilai kesenjangan yang lebih tinggi berarti kebutuhan lebih tinggi. Kembalikan JSON sesuai skema.\n"
            .'Rencana pengguna: '.json_encode($input, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n"
            .'Acuan aktivitas terdekat: '.json_encode([
                'title' => $requirements->title,
                'budget_range' => [
                    'min' => $requirements->min_budget,
                    'max' => $requirements->max_budget,
                ],
                'required_people' => $requirements->required_people,
                'duration_days' => $requirements->duration_days,
            ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)."\n"
            .'Kandidat yang sudah diurutkan dengan skor deterministik: '.json_encode($context, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }

    private function validatedExplanations(array $generated, array $candidates): array
    {
        if (! isset($generated['matches']) || ! is_array($generated['matches'])) {
            throw new UnexpectedValueException('Struktur hasil Gemini tidak valid.');
        }

        $candidateIds = array_column($candidates, 'region_id');
        $explanations = [];

        foreach ($generated['matches'] as $match) {
            if (! is_array($match)
                || ! isset($match['region_id'], $match['match_reason'], $match['recommended_action'])
                || ! is_string($match['match_reason'])
                || ! is_string($match['recommended_action'])
            ) {
                throw new UnexpectedValueException('Penjelasan Gemini tidak lengkap.');
            }

            $id = (string) $match['region_id'];
            if (! in_array($id, $candidateIds, true)) {
                throw new UnexpectedValueException('Gemini mengembalikan desa di luar kandidat.');
            }

            $reason = trim($match['match_reason']);
            $action = trim($match['recommended_action']);
            if ($reason === '' || $action === '') {
                throw new UnexpectedValueException('Penjelasan Gemini kosong.');
            }

            $explanations[$id] = [
                'match_reason' => $reason,
                'recommended_action' => $action,
            ];
        }

        if (count($explanations) !== count($candidateIds)) {
            throw new UnexpectedValueException('Gemini tidak memberi penjelasan untuk semua kandidat.');
        }

        return $explanations;
    }

    private function withoutScoringContext(array $candidates): array
    {
        return array_map(function (array $candidate): array {
            unset($candidate['scoring_context']);

            return $candidate;
        }, $candidates);
    }
}
