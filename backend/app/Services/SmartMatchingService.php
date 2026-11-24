<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Desa;
use App\Models\Kabupaten;
use App\Models\Kecamatan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use JsonException;
use UnexpectedValueException;

class SmartMatchingService
{
    private const DEFAULT_RADIUS_KM = 30;

    private const AI_PROMPT_VERSION = 'v2';

    private const CATEGORY_LABELS = [
        'kesehatan' => 'Kesehatan',
        'pendidikan' => 'Pendidikan',
        'internet' => 'Akses Internet',
        'infrastruktur' => 'Infrastruktur',
        'ekonomi' => 'Ekonomi',
    ];

    public function availableProgramCategories(): array
    {
        return Cache::remember('sm:categories', now()->addHour(), function (): array {
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
        });
    }

    public function searchLocations(string $search): array
    {
        $normalizedSearch = mb_strtolower(trim($search));
        $searchLocations = function () use ($normalizedSearch): array {
            $escapedSearch = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $normalizedSearch);
            $keyword = '%'.$escapedSearch.'%';

            $kabupaten = DB::table('kabupaten')
                ->whereRaw("LOWER(nama_kabupaten) LIKE ? ESCAPE '!'", [$keyword])
                ->orderBy('nama_kabupaten')
                ->limit(5)
                ->get(['kode_kab', 'nama_kabupaten', 'tipe'])
                ->map(fn (object $item): array => [
                    'type' => 'kabupaten',
                    'code' => (string) $item->kode_kab,
                    'kindLabel' => $item->tipe === 'kota' ? 'Kota' : 'Kabupaten',
                    'name' => $item->nama_kabupaten,
                    'label' => ($item->tipe === 'kota' ? 'Kota ' : 'Kabupaten ').$item->nama_kabupaten,
                ]);

            $desa = DB::table('desa')
                ->join('desa_geom', 'desa.kode_desa', '=', 'desa_geom.kode_desa')
                ->join('kecamatan', 'desa.kode_kec', '=', 'kecamatan.kode_kec')
                ->join('kabupaten', 'kecamatan.kode_kab', '=', 'kabupaten.kode_kab')
                ->whereRaw("LOWER(desa.nama_desa) LIKE ? ESCAPE '!'", [$keyword])
                ->orderBy('desa.nama_desa')
                ->limit(10)
                ->get([
                    'desa.kode_desa',
                    'desa.nama_desa',
                    'desa.unit_type',
                    'kecamatan.nama_kecamatan',
                    'kabupaten.nama_kabupaten',
                ])
                ->map(fn (object $item): array => [
                    'type' => 'desa',
                    'code' => (string) $item->kode_desa,
                    'kindLabel' => strtolower((string) $item->unit_type) === 'kelurahan'
                        ? 'Kelurahan'
                        : 'Desa',
                    'name' => $item->nama_desa,
                    'label' => mb_convert_case($item->nama_desa, MB_CASE_TITLE, 'UTF-8'),
                    'subtitle' => $item->nama_kecamatan.', '.$item->nama_kabupaten,
                ]);

            return $kabupaten->concat($desa)->values()->all();
        };

        if (mb_strlen($normalizedSearch) < 2) {
            return $searchLocations();
        }

        return Cache::remember(
            'sm:locations:'.md5($normalizedSearch),
            now()->addMinutes(15),
            $searchLocations,
        );
    }

    public function processSmartMatching(array $input): array
    {
        $locationType = $input['location_type'] ?? null;
        $radiusKm = (float) ($input['radius_km'] ?? self::DEFAULT_RADIUS_KM);
        $offset = (int) ($input['offset'] ?? 0);
        $limit = (int) ($input['limit'] ?? 5);

        $rankingPayload = $input;
        unset($rankingPayload['offset'], $rankingPayload['limit']);
        ksort($rankingPayload);

        $ranking = Cache::store('file')->remember(
            'sm:rank:v2:'.md5(json_encode($rankingPayload, JSON_THROW_ON_ERROR)),
            now()->addMinutes(15),
            function () use ($input, $locationType, $radiusKm): array {
                $activities = $this->programActivities($input['bidang']);
                if ($activities->isEmpty()) {
                    return [
                        'status' => 'no_activities',
                        'nearby_found' => true,
                        'requirements' => [],
                        'items' => [],
                    ];
                }

                $requirements = $this->closestActivity($activities, $input);
                $ranked = $this->rankCandidates(
                    $input,
                    $requirements,
                    $locationType,
                    $radiusKm,
                );

                return [
                    'status' => 'ready',
                    'nearby_found' => $ranked['nearby_found'],
                    'requirements' => [
                        'id' => $requirements->id,
                        'title' => $requirements->title,
                        'category' => $requirements->category,
                        'description' => $requirements->description,
                        'min_budget' => $requirements->min_budget,
                        'max_budget' => $requirements->max_budget,
                        'required_people' => $requirements->required_people,
                        'duration_days' => $requirements->duration_days,
                    ],
                    'items' => $ranked['items'],
                ];
            },
        );

        if ($ranking['status'] === 'no_activities') {
            return [
                'matches' => [],
                'total' => 0,
                'has_more' => false,
                'message' => 'Belum ada acuan aktivitas dengan rentang anggaran, jumlah pelaksana, dan durasi yang valid untuk bidang ini.',
            ];
        }

        $requirements = new Activity();
        $requirements->setRawAttributes($ranking['requirements']);

        if (! $ranking['nearby_found']) {
            return [
                'matches' => [],
                'total' => 0,
                'has_more' => false,
                'message' => sprintf(
                    'Tidak ada desa dalam radius %s km dari lokasi yang dipilih.',
                    rtrim(rtrim(number_format($radiusKm, 1, ',', '.'), '0'), ','),
                ),
            ];
        }

        $ranked = $ranking['items'];
        if ($ranked === []) {
            return [
                'matches' => [],
                'total' => 0,
                'has_more' => false,
                'message' => 'Belum ada wilayah dengan data indikator yang cukup untuk bidang ini.',
            ];
        }

        $total = count($ranked);
        $pageRanking = array_slice($ranked, $offset, $limit);
        $page = $this->loadCandidatePage(
            $pageRanking,
            $input,
            $requirements,
            $locationType,
            $radiusKm,
        );

        return [
            'matches' => $this->addAiExplanations($input, $requirements, $page),
            'total' => $total,
            'has_more' => $offset + count($page) < $total,
            'message' => match ($locationType) {
                'desa' => sprintf(
                    'Berhasil mencocokkan program di sekitar lokasi dalam radius %s km.',
                    rtrim(rtrim(number_format($radiusKm, 1, ',', '.'), '0'), ','),
                ),
                'kabupaten' => 'Berhasil mencocokkan program di kabupaten/kota yang dipilih.',
                default => 'Berhasil mencocokkan program dengan seluruh wilayah tersedia.',
            },
        ];
    }

    private function rankCandidates(
        array $input,
        Activity $requirements,
        ?string $locationType,
        float $radiusKm,
    ): array {
        $nearbyDistances = collect();
        if ($locationType === 'desa') {
            $nearbyDistances = $this->nearbyVillageDistances(
                (string) $input['location_code'],
                $radiusKm,
            );

            if ($nearbyDistances->isEmpty()) {
                return ['nearby_found' => false, 'items' => []];
            }
        }

        $query = DB::table('desa')
            ->leftJoin('kecamatan as matching_kecamatan', 'desa.kode_kec', '=', 'matching_kecamatan.kode_kec')
            ->leftJoin('kabupaten as matching_kabupaten', 'matching_kecamatan.kode_kab', '=', 'matching_kabupaten.kode_kab')
            ->select([
                'desa.kode_desa',
                'desa.iks_2024',
                'desa.ike_2024',
                'desa.ikl_2024',
                'desa.jarak_sekolah_resmi_km',
                'desa.jarak_faskes_fix_km',
                'matching_kabupaten.akses_air_minum_persen',
                'matching_kabupaten.akses_internet_layak_persen',
            ]);

        if ($locationType === 'desa') {
            $query->whereIn('desa.kode_desa', $nearbyDistances->keys());
        } elseif ($locationType === 'kabupaten') {
            $query->where('matching_kecamatan.kode_kab', $input['location_code']);
        }

        match ($input['bidang']) {
            'kesehatan' => $query->where(function ($query): void {
                $query->whereNotNull('desa.iks_2024')
                    ->orWhereNotNull('desa.jarak_faskes_fix_km');
            }),
            'pendidikan' => $query->whereNotNull('desa.jarak_sekolah_resmi_km'),
            'internet' => $query->whereNotNull('matching_kabupaten.akses_internet_layak_persen'),
            'infrastruktur' => $query->where(function ($query): void {
                $query->whereNotNull('desa.ikl_2024')
                    ->orWhereNotNull('matching_kabupaten.akses_air_minum_persen');
            }),
            'ekonomi' => $query->whereNotNull('desa.ike_2024'),
        };

        $ranked = $query
            ->get()
            ->map(function (object $candidate) use (
                $input,
                $requirements,
                $locationType,
                $radiusKm,
                $nearbyDistances,
            ): ?array {
                $urgency = $this->sectorUrgencyFromIndicators(
                    $input['bidang'],
                    $candidate->iks_2024 === null ? null : (float) $candidate->iks_2024,
                    $candidate->ike_2024 === null ? null : (float) $candidate->ike_2024,
                    $candidate->ikl_2024 === null ? null : (float) $candidate->ikl_2024,
                    $candidate->jarak_sekolah_resmi_km === null
                        ? null
                        : (float) $candidate->jarak_sekolah_resmi_km,
                    $candidate->jarak_faskes_fix_km === null
                        ? null
                        : (float) $candidate->jarak_faskes_fix_km,
                    $candidate->akses_internet_layak_persen === null
                        ? null
                        : (float) $candidate->akses_internet_layak_persen,
                    $candidate->akses_air_minum_persen === null
                        ? null
                        : (float) $candidate->akses_air_minum_persen,
                );

                if ($urgency === null) {
                    return null;
                }

                $distanceKm = $locationType === 'desa'
                    ? (float) $nearbyDistances[$candidate->kode_desa]->distance_km
                    : null;
                $scores = $this->calculateScores(
                    $urgency,
                    $input,
                    $requirements,
                    $distanceKm,
                    $locationType,
                    $radiusKm,
                );

                return [
                    'region_id' => (string) $candidate->kode_desa,
                    'match_score' => $scores['match_score'],
                    'ranking_score' => $scores['ranking_score'],
                    'distance_km' => $distanceKm,
                ];
            })
            ->filter()
            ->sort(fn (array $first, array $second): int => (
                ($second['ranking_score'] <=> $first['ranking_score'])
                ?: strcmp($first['region_id'], $second['region_id'])
            ))
            ->map(static function (array $candidate): array {
                unset($candidate['ranking_score']);

                return $candidate;
            })
            ->values()
            ->all();

        return ['nearby_found' => true, 'items' => $ranked];
    }

    private function loadCandidatePage(
        array $pageRanking,
        array $input,
        Activity $requirements,
        ?string $locationType,
        float $radiusKm,
    ): array {
        if ($pageRanking === []) {
            return [];
        }

        $desas = DB::table('desa')
            ->leftJoin('kecamatan as matching_kecamatan', 'desa.kode_kec', '=', 'matching_kecamatan.kode_kec')
            ->leftJoin('kabupaten as matching_kabupaten', 'matching_kecamatan.kode_kab', '=', 'matching_kabupaten.kode_kab')
            ->whereIn('desa.kode_desa', array_column($pageRanking, 'region_id'))
            ->select([
                'desa.kode_desa as sm_desa_kode_desa',
                'desa.kode_kec as sm_desa_kode_kec',
                'desa.nama_desa as sm_desa_nama_desa',
                'desa.unit_type as sm_desa_unit_type',
                'desa.iks_2024 as sm_desa_iks_2024',
                'desa.ike_2024 as sm_desa_ike_2024',
                'desa.ikl_2024 as sm_desa_ikl_2024',
                'desa.jarak_sekolah_resmi_km as sm_desa_jarak_sekolah_resmi_km',
                'desa.jarak_faskes_fix_km as sm_desa_jarak_faskes_fix_km',
                'matching_kecamatan.kode_kec as sm_kecamatan_kode_kec',
                'matching_kecamatan.kode_kab as sm_kecamatan_kode_kab',
                'matching_kecamatan.nama_kecamatan as sm_kecamatan_nama_kecamatan',
                'matching_kabupaten.kode_kab as sm_kabupaten_kode_kab',
                'matching_kabupaten.nama_kabupaten as sm_kabupaten_nama_kabupaten',
                'matching_kabupaten.akses_air_minum_persen as sm_kabupaten_akses_air_minum_persen',
                'matching_kabupaten.akses_internet_layak_persen as sm_kabupaten_akses_internet_layak_persen',
            ])
            ->get()
            ->keyBy('sm_desa_kode_desa');

        $page = [];
        foreach ($pageRanking as $rank) {
            $row = $desas->get($rank['region_id']);
            if ($row === null) {
                continue;
            }

            $desa = (new Desa())->newFromBuilder([
                'kode_desa' => $row->sm_desa_kode_desa,
                'kode_kec' => $row->sm_desa_kode_kec,
                'nama_desa' => $row->sm_desa_nama_desa,
                'unit_type' => $row->sm_desa_unit_type,
                'iks_2024' => $row->sm_desa_iks_2024,
                'ike_2024' => $row->sm_desa_ike_2024,
                'ikl_2024' => $row->sm_desa_ikl_2024,
                'jarak_sekolah_resmi_km' => $row->sm_desa_jarak_sekolah_resmi_km,
                'jarak_faskes_fix_km' => $row->sm_desa_jarak_faskes_fix_km,
            ]);

            if ($row->sm_kecamatan_kode_kec !== null) {
                $kecamatan = (new Kecamatan())->newFromBuilder([
                    'kode_kec' => $row->sm_kecamatan_kode_kec,
                    'kode_kab' => $row->sm_kecamatan_kode_kab,
                    'nama_kecamatan' => $row->sm_kecamatan_nama_kecamatan,
                ]);
                if ($row->sm_kabupaten_kode_kab !== null) {
                    $kabupaten = (new Kabupaten())->newFromBuilder([
                        'kode_kab' => $row->sm_kabupaten_kode_kab,
                        'nama_kabupaten' => $row->sm_kabupaten_nama_kabupaten,
                        'akses_air_minum_persen' => $row->sm_kabupaten_akses_air_minum_persen,
                        'akses_internet_layak_persen' => $row->sm_kabupaten_akses_internet_layak_persen,
                    ]);
                    $kecamatan->setRelation('kabupaten', $kabupaten);
                }
                $desa->setRelation('kecamatan', $kecamatan);
            }

            $candidate = $this->scoreCandidate(
                $desa,
                $input,
                $requirements,
                $rank['distance_km'] === null ? null : (float) $rank['distance_km'],
                $locationType,
                $radiusKm,
            );

            if ($candidate !== null) {
                $candidate['match_score'] = $rank['match_score'];
                $page[] = $candidate;
            }
        }

        return $page;
    }

    private function nearbyVillageDistances(string $originCode, float $radiusKm)
    {
        $isSqliteTest = app()->environment('testing')
            && DB::connection()->getDriverName() === 'sqlite';
        $geographyCast = $isSqliteTest ? '' : '::geography';
        $candidateCentroid = "ST_Centroid(candidate_geom.geom){$geographyCast}";
        $originCentroid = "ST_Centroid(origin_geom.geom){$geographyCast}";
        $distanceExpression = "ST_Distance({$candidateCentroid}, {$originCentroid}) / 1000.0";

        return collect(DB::select(
            "SELECT candidate_geom.kode_desa AS region_id,
                {$distanceExpression} AS distance_km
            FROM desa_geom AS candidate_geom
            JOIN desa_geom AS origin_geom ON origin_geom.kode_desa = ?
            WHERE ST_DWithin(
                {$candidateCentroid},
                {$originCentroid},
                CAST(? AS DOUBLE PRECISION)
            )",
            [$originCode, $radiusKm * 1000],
        ))->keyBy('region_id');
    }

    private function programActivities(string $category): Collection
    {
        $activities = Activity::query()
            ->where('category', $category)
            ->where('min_budget', '>', 0)
            ->whereColumn('max_budget', '>=', 'min_budget')
            ->where('required_people', '>', 0)
            ->where('duration_days', '>', 0)
            ->orderBy('id')
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
            ->sort(fn (Activity $first, Activity $second): int => (
                ($this->activityDistance($first, $input) <=> $this->activityDistance($second, $input))
                ?: ($first->id <=> $second->id)
            ))
            ->first();
    }

    private function activityDistance(Activity $activity, array $input): float
    {
        $budget = (float) $input['anggaran'];
        $durationScale = max(1, (int) $input['durasi'] / (int) $activity->duration_days);
        $minimumBudget = (float) $activity->min_budget * $durationScale;
        $maximumBudget = (float) $activity->max_budget * $durationScale;
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

    private function scoreCandidate(
        Desa $desa,
        array $input,
        Activity $requirements,
        ?float $distanceKm,
        ?string $locationType,
        float $radiusKm,
    ): ?array {
        $urgensiBidang = $this->sectorUrgency($desa, $input['bidang']);

        if ($urgensiBidang === null) {
            return null;
        }

        $scores = $this->calculateScores(
            $urgensiBidang,
            $input,
            $requirements,
            $distanceKm,
            $locationType,
            $radiusKm,
        );
        $minimumBudget = $this->minimumBudgetForDuration($requirements, $input);
        $skorAnggaran = $scores['budget_score'];
        $skorKapasitas = $scores['capacity_score'];
        $resourcesMeetMinimum = $scores['resources_meet_minimum'];
        $programMatchScore = $scores['program_match_score'];
        $proximityScore = $scores['proximity_score'];
        $matchScore = $scores['match_score'];
        $kecamatan = $desa->kecamatan;
        $kabupaten = $kecamatan?->kabupaten;

        return [
            'region_id' => (string) $desa->kode_desa,
            'village_name' => ucfirst($desa->unit_type).' '.mb_convert_case($desa->nama_desa, MB_CASE_TITLE, 'UTF-8'),
            'district_name' => $kecamatan?->nama_kecamatan ?? '-',
            'county_name' => $kabupaten?->nama_kabupaten,
            'match_score' => $matchScore,
            'program_match_score' => $programMatchScore,
            'proximity_score' => $proximityScore,
            'distance_km' => $distanceKm === null ? null : round($distanceKm, 1),
            'urgency_level' => $this->urgencyLabel($urgensiBidang),
            'feasibility_status' => $this->feasibilityLabel($skorKapasitas, $resourcesMeetMinimum),
            'resources_sufficient' => $resourcesMeetMinimum,
            'feasibility_message' => $this->feasibilityMessage(
                $input,
                $requirements,
                $resourcesMeetMinimum,
                $minimumBudget,
            ),
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
                'distance_km' => $distanceKm === null ? null : round($distanceKm, 1),
                'proximity_score' => $proximityScore,
                'minimum_budget' => $minimumBudget,
                'maximum_budget' => $requirements->max_budget * max(
                    1,
                    (int) $input['durasi'] / (int) $requirements->duration_days,
                ),
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
        $kabupaten = $desa->kecamatan?->kabupaten;

        return $this->sectorUrgencyFromIndicators(
            $category,
            $desa->iks_2024 === null ? null : (float) $desa->iks_2024,
            $desa->ike_2024 === null ? null : (float) $desa->ike_2024,
            $desa->ikl_2024 === null ? null : (float) $desa->ikl_2024,
            $desa->jarak_sekolah_resmi_km === null ? null : (float) $desa->jarak_sekolah_resmi_km,
            $desa->jarak_faskes_fix_km === null ? null : (float) $desa->jarak_faskes_fix_km,
            $kabupaten?->akses_internet_layak_persen,
            $kabupaten?->akses_air_minum_persen,
        );
    }

    private function sectorUrgencyFromIndicators(
        string $category,
        ?float $healthIndex,
        ?float $economicIndex,
        ?float $landIndex,
        ?float $schoolDistance,
        ?float $healthFacilityDistance,
        ?float $internetCoverage,
        ?float $drinkingWaterAccess,
    ): ?float {
        return match ($category) {
            'kesehatan' => $this->averageAvailableScores([
                $healthIndex === null ? null : $this->indexGap($healthIndex),
                $healthFacilityDistance === null
                    ? null
                    : min(max(($healthFacilityDistance / 10) * 100, 0), 100),
            ]),
            'pendidikan' => $schoolDistance === null
                ? null
                : min(max(($schoolDistance / 5) * 100, 0), 100),
            'internet' => $internetCoverage === null
                ? null
                : min(max(100 - $internetCoverage, 0), 100),
            'infrastruktur' => $this->averageAvailableScores([
                $landIndex === null ? null : $this->indexGap($landIndex),
                $drinkingWaterAccess === null
                    ? null
                    : min(max(100 - $drinkingWaterAccess, 0), 100),
            ]),
            'ekonomi' => $economicIndex === null ? null : $this->indexGap($economicIndex),
            default => null,
        };
    }

    private function calculateScores(
        float $urgency,
        array $input,
        Activity $requirements,
        ?float $distanceKm,
        ?string $locationType,
        float $radiusKm,
    ): array {
        $budget = (float) $input['anggaran'];
        $minimumBudget = $this->minimumBudgetForDuration($requirements, $input);
        $budgetScore = $budget < $minimumBudget
            ? ($budget / $minimumBudget) * 100
            : 100;
        $peopleScore = min(((int) $input['pelaksana'] / $requirements->required_people) * 100, 100);
        $durationScore = min(((int) $input['durasi'] / $requirements->duration_days) * 100, 100);
        $capacityScore = ($budgetScore * 0.5) + ($peopleScore * 0.25) + ($durationScore * 0.25);
        $resourceMinimumScore = min($budgetScore, $peopleScore, $durationScore);
        $resourcesMeetMinimum = $budget >= $minimumBudget
            && (int) $input['pelaksana'] >= $requirements->required_people
            && (int) $input['durasi'] >= $requirements->duration_days;
        $unroundedProgramMatchScore = ($urgency * 0.5) + ($resourceMinimumScore * 0.5);
        $programMatchScore = (int) round($unroundedProgramMatchScore);
        $unroundedProximityScore = $locationType === 'desa' && $distanceKm !== null
            ? max(0, 1 - ($distanceKm / $radiusKm)) * 100
            : null;
        $proximityScore = $unroundedProximityScore === null
            ? null
            : round($unroundedProximityScore);
        $rankingScore = $unroundedProximityScore === null
            ? $unroundedProgramMatchScore
            : ($unroundedProgramMatchScore * 0.6) + ($unroundedProximityScore * 0.4);
        $matchScore = $locationType === 'desa' && $proximityScore !== null
            ? (int) round(($programMatchScore * 0.6) + ($proximityScore * 0.4))
            : $programMatchScore;

        return [
            'budget_score' => $budgetScore,
            'capacity_score' => $capacityScore,
            'resources_meet_minimum' => $resourcesMeetMinimum,
            'program_match_score' => $programMatchScore,
            'proximity_score' => $proximityScore,
            'ranking_score' => $rankingScore,
            'match_score' => $matchScore,
        ];
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

    private function feasibilityMessage(
        array $input,
        Activity $requirements,
        bool $resourcesMeetMinimum,
        float $minimumBudget,
    ): string {
        $issues = [];
        $budget = (float) $input['anggaran'];
        $people = (int) $input['pelaksana'];
        $requiredPeople = (int) $requirements->required_people;
        $duration = (int) $input['durasi'];
        $requiredDuration = (int) $requirements->duration_days;

        if ($budget < $minimumBudget) {
            $issues[] = sprintf(
                'Anggaran operasional berpotensi tidak mencukupi untuk durasi %d hari (Rp%s tersedia; estimasi minimum Rp%s).',
                $duration,
                number_format($budget, 0, ',', '.'),
                number_format($minimumBudget, 0, ',', '.'),
            );
        }

        if ($people < $requiredPeople) {
            $issues[] = sprintf(
                'Jumlah pelaksana berpotensi kurang (%d tersedia; acuan %d orang).',
                $people,
                $requiredPeople,
            );
        }

        if ($duration < $requiredDuration) {
            $issues[] = sprintf(
                'Durasi pelaksanaan berpotensi tidak mencukupi (%d hari tersedia; acuan %d hari).',
                $duration,
                $requiredDuration,
            );
        }

        if ($issues !== []) {
            return implode(' ', $issues);
        }

        return $resourcesMeetMinimum
            ? 'Anggaran, jumlah pelaksana, dan durasi sudah sesuai kebutuhan.'
            : 'Kelayakan sumber daya perlu disesuaikan dengan kebutuhan kegiatan.';
    }

    private function minimumBudgetForDuration(Activity $activity, array $input): float
    {
        $durationScale = max(1, (int) $input['durasi'] / (int) $activity->duration_days);

        return (float) $activity->min_budget * $durationScale;
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
            number_format($this->minimumBudgetForDuration($requirements, $input), 0, ',', '.'),
            number_format(
                (float) $requirements->max_budget * max(
                    1,
                    (int) $input['durasi'] / (int) $requirements->duration_days,
                ),
                0,
                ',',
                '.',
            ),
        );

        $minimumBudget = $this->minimumBudgetForDuration($requirements, $input);
        $budget = match (true) {
            (float) $input['anggaran'] < $minimumBudget => 'Anggaran pengguna di bawah estimasi minimum aktivitas untuk durasi yang dipilih sehingga cakupan perlu disesuaikan',
            (float) $input['anggaran'] > $requirements->max_budget * max(1, (int) $input['durasi'] / (int) $requirements->duration_days) => 'Anggaran pengguna di atas rentang estimasi acuan aktivitas, tetapi memenuhi batas minimum',
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
            || (int) $input['durasi'] < $requirements->duration_days
        ) {
            $minimumBudget = $this->minimumBudgetForDuration($requirements, $input);

            return sprintf(
                'Acuan terdekat: "%s". Mulai dengan pilot %s berskala terbatas; estimasi anggaran minimum Rp%s dengan %d pelaksana selama %d hari.',
                $requirements->title,
                $actions[$input['bidang']],
                number_format($minimumBudget, 0, ',', '.'),
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
        $rankingPayload = $input;
        unset($rankingPayload['offset'], $rankingPayload['limit']);
        ksort($rankingPayload);

        $cacheKeys = [];
        $missingCandidates = [];
        foreach ($candidates as $index => $candidate) {
            $cacheKey = $this->aiExplanationCacheKey($rankingPayload, $requirements, $candidate);
            $cacheKeys[$candidate['region_id']] = $cacheKey;
            $cached = Cache::get($cacheKey);

            if (is_array($cached)
                && is_string($cached['match_reason'] ?? null)
                && trim($cached['match_reason']) !== ''
                && is_string($cached['recommended_action'] ?? null)
                && trim($cached['recommended_action']) !== ''
            ) {
                $candidates[$index]['match_reason'] = $cached['match_reason'];
                $candidates[$index]['recommended_action'] = $cached['recommended_action'];
            } else {
                $missingCandidates[] = $candidate;
            }
        }

        if ($missingCandidates === []) {
            return $this->withoutScoringContext($candidates);
        }

        $apiKey = config('services.gemini.key');
        if (! is_string($apiKey) || trim($apiKey) === '') {
            Log::warning('Smart Matching Gemini fallback used: API key is not configured.');

            return $this->withoutScoringContext($candidates);
        }

        try {
            $response = Http::withHeaders(['x-goog-api-key' => $apiKey])
                ->timeout(5)
                ->post(config('services.gemini.url'), [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $this->aiPrompt($rankingPayload, $requirements, $missingCandidates)],
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

            $explanations = $this->validatedExplanations($generated, $missingCandidates);

            foreach ($candidates as $index => $candidate) {
                $regionId = $candidate['region_id'];
                if (isset($explanations[$regionId])) {
                    Cache::put($cacheKeys[$regionId], $explanations[$regionId], now()->addDays(30));
                    $candidates[$index]['match_reason'] = $explanations[$regionId]['match_reason'];
                    $candidates[$index]['recommended_action'] = $explanations[$regionId]['recommended_action'];
                }
            }

            return $this->withoutScoringContext($candidates);
        } catch (ConnectionException|RequestException|JsonException|UnexpectedValueException $exception) {
            Log::warning('Smart Matching Gemini fallback used.', [
                'message' => $exception->getMessage(),
            ]);

            return $this->withoutScoringContext($candidates);
        }
    }

    private function aiExplanationCacheKey(array $payload, Activity $requirements, array $candidate): string
    {
        return 'sm:explanation:'.self::AI_PROMPT_VERSION.':'.hash('sha256', json_encode([
            'region_id' => $candidate['region_id'],
            'payload' => $payload,
            'requirements' => [
                'id' => $requirements->id,
                'title' => $requirements->title,
                'min_budget' => $requirements->min_budget,
                'max_budget' => $requirements->max_budget,
                'required_people' => $requirements->required_people,
                'duration_days' => $requirements->duration_days,
            ],
            'candidate' => [
                'village_name' => $candidate['village_name'],
                'district_name' => $candidate['district_name'],
                'match_score' => $candidate['match_score'],
                'urgency_level' => $candidate['urgency_level'],
                'feasibility_status' => $candidate['feasibility_status'],
                'distance_km' => $candidate['distance_km'],
                'scoring_context' => $candidate['scoring_context'],
            ],
        ], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
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
            'distance_km' => $candidate['distance_km'],
            'scoring_context' => $candidate['scoring_context'],
        ], $candidates);

        return "Bertindak sebagai analis dampak sosial spasial SENTRA. Hasilkan alasan kecocokan 1-2 kalimat dan aksi yang realistis untuk setiap kandidat. Gunakan hanya data yang diberikan, jangan mengubah urutan/skor, jangan mengarang nilai atau menjanjikan hasil. Sebutkan jarak dari domisili bila relevan. Jika anggaran di bawah minimum, sarankan pilot atau pengurangan cakupan. Hubungkan kesehatan dengan indeks kesehatan dan jarak fasilitas kesehatan; pendidikan dengan jarak sekolah; internet dengan kesenjangan akses internet; infrastruktur dengan kualitas lahan dan kesenjangan akses air minum; ekonomi hanya dengan indikator ekonomi yang tersedia. Nilai kesenjangan yang lebih tinggi berarti kebutuhan lebih tinggi. Kembalikan JSON sesuai skema.\n"
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
