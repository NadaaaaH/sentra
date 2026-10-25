<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SumberData extends Model
{
    protected $table = 'sumber_data';

    protected $fillable = [
        'nama_sumber',
        'url',
        'deskripsi',
        'tahun_data',
    ];

    protected function casts(): array
    {
        return [
            'tahun_data' => 'integer',
        ];
    }
}
