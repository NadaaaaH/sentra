<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SmartMatchingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bidang' => ['required', 'string', Rule::in([
                'kesehatan',
                'pendidikan',
                'internet',
                'infrastruktur',
                'ekonomi',
            ])],
            'anggaran' => ['required', 'numeric', 'min:0'],
            'pelaksana' => ['required', 'integer', 'min:1'],
            'durasi' => ['required', 'integer', 'min:1'],
            // TODO(FRONTEND): hapus default domisili ini setelah frontend mengirim `domisili`, lalu ubah rule `domisili` di SmartMatchingRequest menjadi required.
            'domisili' => [
                'sometimes',
                'nullable',
                'string',
                Rule::exists('desa', 'kode_desa'),
                Rule::exists('desa_geom', 'kode_desa'),
            ],
            'radius_km' => ['sometimes', 'numeric', 'min:1', 'max:100'],
        ];
    }
}
