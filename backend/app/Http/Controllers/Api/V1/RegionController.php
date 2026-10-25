<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Desa;
use App\Http\Resources\V1\DesaDetailResource;
use App\Traits\ApiResponse;

class RegionController extends Controller
{
    use ApiResponse;

    /**
     * Menampilkan detail desa berdasarkan kode_desa saat peta diklik
     */
    public function showByDesa($kode_desa)
    {
        // Query data desa beserta relasi kecamatan dan indeks urgensi
        $desa = Desa::with(['kecamatan.kabupaten', 'indeksUrgensi'])
            ->where('kode_desa', $kode_desa)
            ->first();

        if (!$desa) {
            return $this->errorResponse('Data desa tidak ditemukan', 404);
        }

        return (new DesaDetailResource($desa))
            ->additional([
                'status'  => 'Success',
                'message' => 'Detail profil desa berhasil dimuat.'
            ]);
    }
}