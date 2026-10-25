<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kecamatan extends Model
{
    protected $table = 'kecamatan';

    protected $fillable = [
        'kode_kec',
        'kode_kab',
        'nama_kecamatan',
    ];

    public function kabupaten(): BelongsTo
    {
        return $this->belongsTo(Kabupaten::class, 'kode_kab', 'kode_kab');
    }

    public function desa(): HasMany
    {
        return $this->hasMany(Desa::class, 'kode_kec', 'kode_kec');
    }
}
