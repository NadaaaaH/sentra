<?php

namespace Tests\Feature;

use App\Services\KabupatenIndicatorService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class KabupatenIndicatorServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('kabupaten', function (Blueprint $table): void {
            $table->string('kode_kab')->primary();
            $table->string('nama_kabupaten');
            $table->string('tipe');
            $table->float('akses_internet_layak_persen')->nullable();
        });

        Schema::create('kecamatan', function (Blueprint $table): void {
            $table->string('kode_kec')->primary();
            $table->string('kode_kab');
        });

        Schema::create('desa', function (Blueprint $table): void {
            $table->string('kode_desa')->primary();
            $table->string('kode_kec');
            $table->float('iks_2024')->nullable();
            $table->float('ike_2024')->nullable();
            $table->float('ikl_2024')->nullable();
            $table->float('jarak_sekolah_resmi_km')->nullable();
            $table->float('jarak_faskes_fix_km')->nullable();
        });

        Schema::create('indeks_urgensi', function (Blueprint $table): void {
            $table->string('kode_desa')->primary();
            $table->float('skor_komposit')->nullable();
            $table->integer('kelas_urgensi')->nullable();
        });
    }

    public function test_it_averages_village_indicators_without_population_weights(): void
    {
        DB::table('kabupaten')->insert([
            'kode_kab' => '3301',
            'nama_kabupaten' => 'Cilacap',
            'tipe' => 'kabupaten',
            'akses_internet_layak_persen' => 90,
        ]);
        DB::table('kecamatan')->insert([
            ['kode_kec' => '330101', 'kode_kab' => '3301'],
            ['kode_kec' => '330102', 'kode_kab' => '3301'],
        ]);
        DB::table('desa')->insert([
            [
                'kode_desa' => '3301012001',
                'kode_kec' => '330101',
                'iks_2024' => 0.8,
                'ike_2024' => 0.6,
                'ikl_2024' => 0.5,
                'jarak_sekolah_resmi_km' => 0.5,
                'jarak_faskes_fix_km' => 4,
            ],
            [
                'kode_desa' => '3301022001',
                'kode_kec' => '330102',
                'iks_2024' => 0.6,
                'ike_2024' => 0.8,
                'ikl_2024' => 0.9,
                'jarak_sekolah_resmi_km' => 2,
                'jarak_faskes_fix_km' => 2,
            ],
        ]);
        DB::table('indeks_urgensi')->insert([
            ['kode_desa' => '3301012001', 'skor_komposit' => 80, 'kelas_urgensi' => 5],
            ['kode_desa' => '3301022001', 'skor_komposit' => 60, 'kelas_urgensi' => 4],
        ]);

        $result = app(KabupatenIndicatorService::class)->getByKode('3301');

        $this->assertSame(2, $result['jumlahDesa']);
        $this->assertSame(1, $result['jumlahDesaUrgent']);
        $this->assertSame([
            ['label' => 'Kondisi Ekonomi', 'nilai' => 30.0],
            ['label' => 'Pendidikan', 'nilai' => 50.0],
            ['label' => 'Kesehatan', 'nilai' => 40.0],
            ['label' => 'Kualitas Lahan', 'nilai' => 30.0],
            ['label' => 'Akses Internet Layak', 'nilai' => 10.0],
        ], $result['kesenjangan']);
    }

    public function test_it_returns_null_for_an_unknown_county(): void
    {
        $this->assertNull(app(KabupatenIndicatorService::class)->getByKode('9999'));
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('desa');
        Schema::dropIfExists('indeks_urgensi');
        Schema::dropIfExists('kecamatan');
        Schema::dropIfExists('kabupaten');

        parent::tearDown();
    }
}
