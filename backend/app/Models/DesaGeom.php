<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DesaGeom extends Model
{
    protected $table = 'desa_geom';
    protected $guarded = ['id'];
    
    // Matikan timestamps karena kita insert via Python sebelumnya
    public $timestamps = false; 
}