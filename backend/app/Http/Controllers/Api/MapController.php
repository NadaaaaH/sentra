<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MapController extends Controller
{
    /**
     * Endpoint: GET /api/map/desa
     * Mengambil semua poligon desa (atau berdasarkan filter kelas urgensi)
     */
    public function desaGeojson(Request $request)
    {
        $query = DB::table('desa_geom')
            ->join('desa', 'desa_geom.kode_desa', '=', 'desa.kode_desa')
            ->join('kecamatan', 'desa.kode_kec', '=', 'kecamatan.kode_kec') // Tambah join kecamatan
            ->leftJoin('indeks_urgensi', 'desa.kode_desa', '=', 'indeks_urgensi.kode_desa')
            ->select(
                'desa.kode_desa',
                'desa.nama_desa',
                'indeks_urgensi.kelas_urgensi',
                'indeks_urgensi.label_urgensi',
                DB::raw('ST_AsGeoJSON(desa_geom.geom) as geometry')
            );

        // Filter berdasarkan kabupaten (contoh: /api/map/desa?kab=3301)
        if ($request->has('kab')) {
            $query->where('kecamatan.kode_kab', $request->kab);
        }

        // Filter berdasarkan kelas urgensi
        if ($request->has('kelas')) {
            $query->where('indeks_urgensi.kelas_urgensi', $request->kelas);
        }

        $data = $query->get();

        $features = $data->map(function ($item) {
            return [
                'type' => 'Feature',
                'geometry' => json_decode($item->geometry),
                'properties' => [
                    'kode_desa' => $item->kode_desa,
                    'nama_desa' => $item->nama_desa,
                    'kelas' => $item->kelas_urgensi,
                    'label' => $item->label_urgensi ?? 'Belum Dinilai',
                ]
            ];
        });

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features
        ]);
    }

    /**
     * Endpoint: GET /api/map/faskes
     * Mengambil semua titik koordinat Faskes
     */
    public function faskesGeojson()
    {
        $data = DB::table('faskes_point')->select(
            'id', 'nama', 'tipe_faskes',
            DB::raw('ST_AsGeoJSON(geom) as geometry')
        )->get();

        $features = $data->map(function ($item) {
            return [
                'type' => 'Feature',
                'geometry' => json_decode($item->geometry),
                'properties' => [
                    'id' => $item->id,
                    'nama' => $item->nama,
                    'tipe' => $item->tipe_faskes,
                ]
            ];
        });

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features
        ]);
    }

    /**
     * Endpoint: GET /api/map/sekolah
     * Mengambil semua titik koordinat Sekolah
     */
    public function sekolahGeojson()
    {
        $data = DB::table('sekolah_point')->select(
            'id', 'nama', 'jenjang',
            DB::raw('ST_AsGeoJSON(geom) as geometry')
        )->get();

        $features = $data->map(function ($item) {
            return [
                'type' => 'Feature',
                'geometry' => json_decode($item->geometry),
                'properties' => [
                    'id' => $item->id,
                    'nama' => $item->nama,
                    'jenjang' => $item->jenjang,
                ]
            ];
        });

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features
        ]);
    }
}