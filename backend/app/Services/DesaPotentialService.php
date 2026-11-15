<?php

namespace App\Services;

use App\Models\Desa;

class DesaPotentialService
{
    public function generate(Desa $desa, ?float $aksesInternetPersen): array
    {
        $potensi = [];
        $unitType = strtolower((string) $desa->unit_type);

        if ($desa->ike_2024 !== null && $desa->ike_2024 >= 0.60) {
            $potensi[] = $unitType === 'kelurahan'
                ? 'Potensi Sentra Jasa, Perdagangan & UMKM.'
                : 'Potensi Pengembangan Ekonomi Lokal & Komoditas Desa.';
        }

        if ($desa->ikl_2024 !== null && $desa->ikl_2024 >= 0.60) {
            $potensi[] = 'Potensi Kawasan Asri, Agrowisata & Pertanian Berkelanjutan.';
        }

        if ($desa->iks_2024 !== null && $desa->iks_2024 >= 0.65) {
            $potensi[] = 'Potensi Pemberdayaan Komunitas & Kader Masyarakat.';
        }

        if ($desa->jarak_sekolah_resmi_km !== null && $desa->jarak_sekolah_resmi_km <= 1.0) {
            $potensi[] = 'Potensi Pusat Kegiatan Literasi & Edukasi Pemuda.';
        }

        if ($desa->jarak_faskes_fix_km !== null && $desa->jarak_faskes_fix_km <= 3.0) {
            $potensi[] = 'Potensi Optimalisasi Layanan Kesehatan Preventif & Posyandu.';
        }

        if ($aksesInternetPersen !== null && $aksesInternetPersen >= 75) {
            $potensi[] = 'Potensi Digitalisasi UMKM & Pemasaran Online.';
        }

        if ($potensi === []) {
            $potensi[] = $this->relativeFallback($desa);
        }

        return array_values(array_unique($potensi));
    }

    private function relativeFallback(Desa $desa): string
    {
        $scores = array_filter([
            'ekonomi' => $desa->ike_2024,
            'lingkungan' => $desa->ikl_2024,
            'sosial' => $desa->iks_2024,
        ], static fn ($value): bool => $value !== null);

        if ($this->isTertinggalWithFarFacilities($desa) && $scores !== []) {
            $strongestDimension = array_search(max($scores), $scores, true);

            return match ($strongestDimension) {
                'ekonomi' => strtolower((string) $desa->unit_type) === 'kelurahan'
                    ? 'Potensi unggulan relatif: Sentra Jasa, Perdagangan & UMKM.'
                    : 'Potensi unggulan relatif: Pengembangan Ekonomi Lokal & Komoditas Desa.',
                'lingkungan' => 'Potensi unggulan relatif: Kawasan Asri, Agrowisata & Pertanian Berkelanjutan.',
                'sosial' => 'Potensi unggulan relatif: Pemberdayaan Komunitas & Kader Masyarakat.',
            };
        }

        return 'Potensi pengembangan berbasis aset dan kebutuhan lokal wilayah.';
    }

    private function isTertinggalWithFarFacilities(Desa $desa): bool
    {
        $status = strtoupper(trim((string) $desa->status_idm_2024));
        $scores = [$desa->iks_2024, $desa->ike_2024, $desa->ikl_2024];

        return in_array($status, ['TERTINGGAL', 'SANGAT TERTINGGAL'], true)
            && ! in_array(null, $scores, true)
            && max($scores) < 0.60
            && $desa->jarak_sekolah_resmi_km !== null
            && $desa->jarak_sekolah_resmi_km > 1.0
            && $desa->jarak_faskes_fix_km !== null
            && $desa->jarak_faskes_fix_km > 3.0;
    }
}
