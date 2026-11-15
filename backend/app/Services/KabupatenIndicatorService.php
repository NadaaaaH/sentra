<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class KabupatenIndicatorService
{
    public function getByKode(string $kodeKab): ?array
    {
        $kabupaten = DB::table('kabupaten')
            ->where('kode_kab', $kodeKab)
            ->first([
                'kode_kab',
                'nama_kabupaten',
                'tipe',
                'akses_internet_layak_persen',
            ]);

        if (! $kabupaten) {
            return null;
        }

        $rataRata = DB::table('desa')
            ->join('kecamatan', 'desa.kode_kec', '=', 'kecamatan.kode_kec')
            ->leftJoin('indeks_urgensi', 'desa.kode_desa', '=', 'indeks_urgensi.kode_desa')
            ->where('kecamatan.kode_kab', $kodeKab)
            ->selectRaw('COUNT(desa.kode_desa) AS jumlah_desa')
            ->selectRaw('AVG(indeks_urgensi.skor_komposit) AS rata_urgensi')
            ->selectRaw('SUM(CASE WHEN indeks_urgensi.kelas_urgensi = 5 THEN 1 ELSE 0 END) AS jumlah_desa_urgent')
            ->selectRaw(
                'AVG(CASE WHEN desa.ike_2024 IS NOT NULL THEN (1.0 - desa.ike_2024) * 100 END) AS ekonomi'
            )
            ->selectRaw(
                'AVG(CASE WHEN desa.jarak_sekolah_resmi_km IS NOT NULL THEN CASE WHEN desa.jarak_sekolah_resmi_km > 1 THEN 100.0 ELSE 0.0 END END) AS pendidikan'
            )
            ->selectRaw(
                'AVG(CASE
                    WHEN desa.iks_2024 IS NOT NULL AND desa.jarak_faskes_fix_km IS NOT NULL
                        THEN (((1.0 - desa.iks_2024) * 100) + CASE WHEN desa.jarak_faskes_fix_km > 3 THEN 100.0 ELSE 0.0 END) / 2
                    WHEN desa.iks_2024 IS NOT NULL THEN (1.0 - desa.iks_2024) * 100
                    WHEN desa.jarak_faskes_fix_km IS NOT NULL THEN CASE WHEN desa.jarak_faskes_fix_km > 3 THEN 100.0 ELSE 0.0 END
                END) AS kesehatan'
            )
            ->selectRaw(
                'AVG(CASE WHEN desa.ikl_2024 IS NOT NULL THEN (1.0 - desa.ikl_2024) * 100 END) AS lahan'
            )
            ->first();

        $kesenjangan = [];
        foreach ([
            'Kondisi Ekonomi' => $rataRata->ekonomi,
            'Pendidikan' => $rataRata->pendidikan,
            'Kesehatan' => $rataRata->kesehatan,
            'Kualitas Lahan' => $rataRata->lahan,
            'Akses Internet Layak' => $kabupaten->akses_internet_layak_persen === null
                ? null
                : 100 - (float) $kabupaten->akses_internet_layak_persen,
        ] as $label => $nilai) {
            if ($nilai !== null) {
                $kesenjangan[] = [
                    'label' => $label,
                    'nilai' => round((float) $nilai, 2),
                ];
            }
        }

        return [
            'jenis' => $kabupaten->tipe === 'kota' ? 'Kota' : 'Kabupaten',
            'kodeKab' => $kabupaten->kode_kab,
            'nama' => $kabupaten->nama_kabupaten,
            'jumlahDesa' => (int) $rataRata->jumlah_desa,
            'jumlahDesaUrgent' => (int) ($rataRata->jumlah_desa_urgent ?? 0),
            'indeksUrgensi' => $rataRata->rata_urgensi !== null
                ? round((float) $rataRata->rata_urgensi)
                : 0,
            'kesenjangan' => $kesenjangan,
        ];
    }
}