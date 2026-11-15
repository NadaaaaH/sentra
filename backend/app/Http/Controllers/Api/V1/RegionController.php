<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\DesaDetailResource;
use App\Models\Desa;
use App\Services\ActivityRecommendationService;
use App\Services\KabupatenIndicatorService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
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

        // Query data desa beserta relasi kecamatan dan indeks urgensi
        $desa = Desa::with(['kecamatan.kabupaten', 'indeksUrgensi'])
            ->where('kode_desa', $kode_desa)
            ->first();

        if (! $desa) {
            return $this->error('Data desa tidak ditemukan', 404);
        }

        $result = filter_var(
            $validated['include_recommendations'] ?? false,
            FILTER_VALIDATE_BOOLEAN,
        )
            ? $recommendations->generate($desa, $validated)
            : ['recommendations' => [], 'ai_available' => false];
        $desa->setAttribute('recommendations', $result['recommendations']);
        $desa->setAttribute('ai_available', $result['ai_available']);

        return (new DesaDetailResource($desa))
            ->additional([
                'status' => 'Success',
                'message' => 'Detail profil desa berhasil dimuat.',
            ]);
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
