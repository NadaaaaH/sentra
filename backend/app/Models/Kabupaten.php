<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kabupaten extends Model
{
    protected $table = 'kabupaten';

    protected $fillable = [
        'kode_kab',
        'kode_prov',
        'nama_kabupaten',
        'tipe',
        'rata2_idm_desa',
        'persen_miskin_kab',
        'akses_air_minum_persen',
        'akses_internet_layak_persen',
        'jumlah_rs_kab',
        'jumlah_sekolah_kab',
        'jumlah_penduduk',
        'rs_per_10rb_penduduk',
        'sekolah_per_10rb_penduduk',
    ];

    protected function casts(): array
    {
        return [
            'rata2_idm_desa' => 'float',
            'persen_miskin_kab' => 'float',
            'akses_air_minum_persen' => 'float',
            'akses_internet_layak_persen' => 'float',
            'jumlah_rs_kab' => 'float',
            'jumlah_sekolah_kab' => 'float',
            'jumlah_penduduk' => 'float',
            'rs_per_10rb_penduduk' => 'float',
            'sekolah_per_10rb_penduduk' => 'float',
        ];
    }

    public function provinsi(): BelongsTo
    {
        return $this->belongsTo(Provinsi::class, 'kode_prov', 'kode_prov');
    }

    public function kecamatan(): HasMany
    {
        return $this->hasMany(Kecamatan::class, 'kode_kab', 'kode_kab');
    }
}
