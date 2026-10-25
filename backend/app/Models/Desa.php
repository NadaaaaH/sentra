<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Desa extends Model
{
    protected $table = 'desa';

    // Set primary key ke kode_desa agar query find() & route model binding akurat
    protected $primaryKey = 'kode_desa';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'kode_desa',
        'kode_kec',
        'nama_desa',
        'unit_type',
        'kode_temporary',
        'iks_2024',
        'ike_2024',
        'ikl_2024',
        'nilai_idm_2024',
        'status_idm_2024',
        'jarak_sekolah_resmi_km',
        'jarak_faskes_fix_km',
        'faskes_terdekat',
        'tipe_faskes_terdekat',
    ];

    protected function casts(): array
    {
        return [
            'kode_temporary' => 'boolean',
            'iks_2024' => 'float',
            'ike_2024' => 'float',
            'ikl_2024' => 'float',
            'nilai_idm_2024' => 'float',
            'jarak_sekolah_resmi_km' => 'float',
            'jarak_faskes_fix_km' => 'float',
        ];
    }

    public function kecamatan(): BelongsTo
    {
        return $this->belongsTo(Kecamatan::class, 'kode_kec', 'kode_kec');
    }

    public function indeksUrgensi(): HasOne
    {
        return $this->hasOne(IndeksUrgensi::class, 'kode_desa', 'kode_desa');
    }
}