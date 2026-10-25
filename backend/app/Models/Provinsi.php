<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Provinsi extends Model
{
    protected $table = 'provinsi';

    protected $fillable = [
        'kode_prov',
        'nama_provinsi',
    ];

    public function kabupaten(): HasMany
    {
        return $this->hasMany(Kabupaten::class, 'kode_prov', 'kode_prov');
    }
}
