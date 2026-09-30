<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'category',
        'description',
        'min_budget',
        'max_budget',
        'required_people',
        'duration_days',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'min_budget' => 'integer',
            'max_budget' => 'integer',
            'required_people' => 'integer',
            'duration_days' => 'integer',
        ];
    }
}
