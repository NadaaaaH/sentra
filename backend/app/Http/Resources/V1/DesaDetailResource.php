<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DesaDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Hitung nilai kesenjangan (0-100)
        $gapKeluargaSehat = round((1 - ($this->iks_2024 ?? 0.5)) * 100);
        $gapKondisiEkonomi = round((1 - ($this->ike_2024 ?? 0.5)) * 100);
        $gapKualitasLahan = round((1 - ($this->ikl_2024 ?? 0.5)) * 100);

        return [
            'jenis'         => 'Desa',
            'nama'          => $this->nama_desa,
            'kabupaten'     => $this->kecamatan->kabupaten->nama_kabupaten ?? 'Kabupaten Cilacap',
            'penduduk'      => 7295,
            'luas'          => 931.98,
            'indeksUrgensi' => (int) ($this->indeksUrgensi->skor_komposit ?? 42),
            
            'kesenjangan' => [
                ['label' => 'Keluarga Sehat', 'nilai' => $gapKeluargaSehat],
                ['label' => 'Kondisi Ekonomi', 'nilai' => $gapKondisiEkonomi],
                ['label' => 'Kualitas Lahan', 'nilai' => $gapKualitasLahan], //index fasil kesehatan dan fasil pendidikan belummm
            ],

            'potensi' => [
                'Lahan pertanian dan perkebunan',
                'Panorama pegunungan dan persawahan',
                'Pariwisata alam air mancur'
            ],

            'saranProgram' => [
                [
                    'judul'     => 'Layanan Kesehatan Terpadu Masyarakat',
                    'bidang'    => 'Kesehatan',
                    'skor'      => 94,
                    'deskripsi' => 'Pelaksanaan pemeriksaan kesehatan berkala, edukasi gizi keluarga, dan penyuluhan sanitasi.',
                    'biaya'     => '13',
                    'relawan'   => '8',
                    'hari'      => '42'
                ],
                [
                    'judul'     => 'Pengolahan Hasil Pertanian & UMKM',
                    'bidang'    => 'Kemiskinan',
                    'skor'      => 90,
                    'deskripsi' => 'Pelatihan pengolahan hasil pertanian dan perkebunan menjadi produk bernilai tambah.',
                    'biaya'     => '21',
                    'relawan'   => '10',
                    'hari'      => '84'
                ]
            ]
        ];
    }
}