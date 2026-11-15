<?php

namespace Tests\Unit;

use App\Models\Desa;
use App\Services\DesaPotentialService;
use PHPUnit\Framework\TestCase;

class DesaPotentialServiceTest extends TestCase
{
    public function test_it_generates_potential_from_idm_access_and_connectivity_rules(): void
    {
        $desa = $this->makeDesa([
            'unit_type' => 'desa',
            'ike_2024' => 0.60,
            'ikl_2024' => 0.60,
            'iks_2024' => 0.65,
            'jarak_sekolah_resmi_km' => 1.0,
            'jarak_faskes_fix_km' => 3.0,
        ]);

        $potensi = (new DesaPotentialService())->generate($desa, 75.0);

        $this->assertSame([
            'Potensi Pengembangan Ekonomi Lokal & Komoditas Desa.',
            'Potensi Kawasan Asri, Agrowisata & Pertanian Berkelanjutan.',
            'Potensi Pemberdayaan Komunitas & Kader Masyarakat.',
            'Potensi Pusat Kegiatan Literasi & Edukasi Pemuda.',
            'Potensi Optimalisasi Layanan Kesehatan Preventif & Posyandu.',
            'Potensi Digitalisasi UMKM & Pemasaran Online.',
        ], $potensi);
    }

    public function test_it_uses_the_strongest_relative_idm_dimension_for_tertinggal_villages(): void
    {
        $desa = $this->makeDesa([
            'unit_type' => 'desa',
            'status_idm_2024' => 'TERTINGGAL',
            'iks_2024' => 0.45,
            'ike_2024' => 0.58,
            'ikl_2024' => 0.50,
            'jarak_sekolah_resmi_km' => 1.1,
            'jarak_faskes_fix_km' => 3.1,
        ]);

        $potensi = (new DesaPotentialService())->generate($desa, null);

        $this->assertSame([
            'Potensi unggulan relatif: Pengembangan Ekonomi Lokal & Komoditas Desa.',
        ], $potensi);
    }

    public function test_it_always_returns_a_potential_when_indicators_are_missing(): void
    {
        $potensi = (new DesaPotentialService())->generate($this->makeDesa([]), null);

        $this->assertNotEmpty($potensi);
        $this->assertNotContains(null, $potensi);
    }

    private function makeDesa(array $attributes): Desa
    {
        $desa = new Desa();
        $desa->setRawAttributes($attributes);

        return $desa;
    }
}
