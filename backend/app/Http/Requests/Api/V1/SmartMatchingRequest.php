<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

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
            'location_type' => [
                'sometimes',
                'nullable',
                'string',
                'required_with:location_code',
                Rule::in(['desa', 'kabupaten']),
            ],
            'location_code' => [
                'sometimes',
                'nullable',
                'string',
                'max:10',
                'required_with:location_type',
            ],
            'radius_km' => ['sometimes', 'numeric', 'min:1', 'max:100'],
            'offset' => ['sometimes', 'integer', 'min:0'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:20'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $type = $this->input('location_type');
            $code = $this->input('location_code');

            if (! is_string($type) || ! is_string($code) || $code === '') {
                return;
            }

            $exists = match ($type) {
                'desa' => DB::table('desa')->where('kode_desa', $code)->exists()
                    && DB::table('desa_geom')->where('kode_desa', $code)->exists(),
                'kabupaten' => DB::table('kabupaten')->where('kode_kab', $code)->exists(),
                default => true,
            };

            if (! $exists) {
                $validator->errors()->add(
                    'location_code',
                    'Lokasi tidak ditemukan atau belum memiliki data yang diperlukan.',
                );
            }
        });
    }
}
