<?php

namespace App\Http\Resources\V1;

use App\Services\DesaPotentialService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DesaDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $kabupaten = $this->kecamatan?->kabupaten;
        $potensi = app(DesaPotentialService::class)->generate(
            $this->resource,
            $kabupaten?->akses_internet_layak_persen,
        );
        $kesenjangan = [];

        foreach ([
            'Kesehatan' => $this->iks_2024,
            'Kondisi Ekonomi' => $this->ike_2024,
            'Kualitas Lahan' => $this->ikl_2024,
        ] as $label => $nilai) {
            if ($nilai !== null) {
                $kesenjangan[] = [
                    'label' => $label,
                    'nilai' => round((1 - $nilai) * 100),
                ];
            }
        }

        if ($kabupaten?->akses_air_minum_persen !== null) {
            $kesenjangan[] = [
                'label' => 'Akses Air Minum',
                'nilai' => round(100 - $kabupaten->akses_air_minum_persen, 2),
            ];
        }

        if ($kabupaten?->akses_internet_layak_persen !== null) {
            $kesenjangan[] = [
                'label' => 'Akses Internet Layak',
                'nilai' => round(100 - $kabupaten->akses_internet_layak_persen, 2),
            ];
        }

        $indikatorPerhatian = [];

        if ($this->jarak_sekolah_resmi_km !== null && $this->jarak_sekolah_resmi_km > 1) {
            $indikatorPerhatian[] = 'pendidikan';
        }

        if ($this->jarak_faskes_fix_km !== null && $this->jarak_faskes_fix_km > 3) {
            $indikatorPerhatian[] = 'kesehatan';
        }

        return [
            'jenis' => ucfirst($this->unit_type),
            'kodeDesa' => $this->kode_desa,
            'nama' => $this->nama_desa,
            'kabupaten' => $kabupaten?->nama_kabupaten,
            'penduduk' => null,
            'luas' => null,
            
            // --- BAGIAN YANG DIUBAH (Hanya soal Index) ---
            'indeksUrgensi' => $this->indeksUrgensi?->skor_komposit,
            'kelas' => $this->indeksUrgensi?->kelas_urgensi,           // 🚀 TAMBAHAN
            'labelUrgensi' => $this->indeksUrgensi?->label_urgensi,    // 🚀 TAMBAHAN
            // ----------------------------------------------
            
            'nilaiIdm' => $this->nilai_idm_2024,
            'statusIdm' => $this->status_idm_2024,
            'jarakSekolahKm' => $this->jarak_sekolah_resmi_km,
            'jarakFaskesKm' => $this->jarak_faskes_fix_km,
            'faskesTerdekat' => $this->faskes_terdekat,
            'tipeFaskesTerdekat' => $this->tipe_faskes_terdekat,
            'indikatorPerhatian' => $indikatorPerhatian,
            'kesenjangan' => $kesenjangan,
            'potensi' => $potensi,
            'rekomendasi' => $this->indeksUrgensi?->rekomendasi,
            'recommendations' => $this->recommendations ?? [],
            'ai_available' => (bool) ($this->ai_available ?? false),
        ];
    }
}