<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\DesaDetailResource;
use App\Models\Desa;
use App\Services\ActivityRecommendationService;
use App\Services\KabupatenIndicatorService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class RegionController extends Controller
{
    use ApiResponse;

    /**
     * Menampilkan detail desa berdasarkan kode_desa saat peta diklik
     */
    public function showByDesa(
        string $kode_desa,
        Request $request,
        ActivityRecommendationService $recommendations,
    ) {
        $validated = $request->validate([
            ...$this->recommendationContextRules(),
            'include_recommendations' => ['sometimes', 'in:true,false,1,0'],
        ]);
        $includeRecommendations = filter_var(
            $validated['include_recommendations'] ?? false,
            FILTER_VALIDATE_BOOLEAN,
        );

        if (! $includeRecommendations) {
            $data = Cache::remember(
                "desa-detail:v1:{$kode_desa}",
                now()->addMinutes(10),
                fn (): ?array => $this->desaDetailData($kode_desa, $request),
            );

            if ($data === null) {
                return $this->error('Data desa tidak ditemukan', 404);
            }

            return response()->json([
                'data' => $data,
                'status' => 'Success',
                'message' => 'Detail profil desa berhasil dimuat.',
            ]);
        }

        $desa = Desa::with(['kecamatan.kabupaten', 'indeksUrgensi'])
            ->where('kode_desa', $kode_desa)
            ->first();

        if (! $desa) {
            return $this->error('Data desa tidak ditemukan', 404);
        }

        $result = $recommendations->generate($desa, $validated);
        $desa->setAttribute('recommendations', $result['recommendations']);
        $desa->setAttribute('ai_available', $result['ai_available']);

        return (new DesaDetailResource($desa))
            ->additional([
                'status' => 'Success',
                'message' => 'Detail profil desa berhasil dimuat.',
            ]);
    }

    private function desaDetailData(string $kodeDesa, Request $request): ?array
    {
        $desa = Desa::with(['kecamatan.kabupaten', 'indeksUrgensi'])
            ->where('kode_desa', $kodeDesa)
            ->first();

        if (! $desa) {
            return null;
        }

        $desa->setAttribute('recommendations', []);
        $desa->setAttribute('ai_available', false);

        return (new DesaDetailResource($desa))->resolve($request);
    }

    public function showRecommendations(
        string $kode_desa,
        Request $request,
        ActivityRecommendationService $recommendations,
    ) {
        $context = $request->validate($this->recommendationContextRules());
        $desa = Desa::with('kecamatan.kabupaten')
            ->where('kode_desa', $kode_desa)
            ->first();

        if (! $desa) {
            return $this->error('Data desa tidak ditemukan', 404);
        }

        return $this->success(
            $recommendations->generate($desa, $context),
            'Rekomendasi kegiatan berhasil dimuat.',
        );
    }

    private function recommendationContextRules(): array
    {
        return [
            'bidang' => ['sometimes', 'required', 'string', Rule::in([
                'kesehatan',
                'pendidikan',
                'internet',
                'infrastruktur',
                'ekonomi',
            ])],
            'budget' => ['required_with:bidang', 'numeric', 'min:0'],
            'people' => ['required_with:bidang', 'integer', 'min:1'],
            'duration' => ['required_with:bidang', 'integer', 'min:1'],
        ];
    }

    public function showByKabupaten(string $kode_kab, KabupatenIndicatorService $indicators)
    {
        $kabupaten = $indicators->getByKode($kode_kab);

        if ($kabupaten === null) {
            return $this->error('Data kabupaten tidak ditemukan', 404);
        }

        return $this->success($kabupaten, 'Indikator kabupaten berhasil dihitung.');
    }
}
