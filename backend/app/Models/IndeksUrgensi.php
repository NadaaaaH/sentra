<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IndeksUrgensi extends Model
{
    protected $table = 'indeks_urgensi';

    protected $fillable = [
        'kode_desa',
        'skor_komposit',
        'kelas_urgensi',
        'label_urgensi',
        'flag_count',
        'kode_temporary',
        'daftar_masalah',
        'rekomendasi',
        'calculated_at',
    ];

    protected function casts(): array
    {
        return [
            'skor_komposit' => 'float',
            'kelas_urgensi' => 'integer',
            'flag_count' => 'integer',
            'kode_temporary' => 'boolean',
            'calculated_at' => 'datetime',
        ];
    }

    public function desa(): BelongsTo
    {
        return $this->belongsTo(Desa::class, 'kode_desa', 'kode_desa');
    }
}
