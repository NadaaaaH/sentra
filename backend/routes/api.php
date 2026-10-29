<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\RegionController;
use App\Http\Controllers\Api\MapController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// API Version 1
Route::prefix('v1')->group(function () {
    Route::get('/ping', function () {
        return response()->json([
            'status' => 'success',
            'message' => 'SENTRA API v1 is running',
            'timestamp' => now()->toIso8601String(),
        ]);
    });

    // Route::apiResource('regions', \App\Http\Controllers\Api\V1\RegionController::class);
    // Endpoint ketika peta/titik desa diklik oleh Frontend
    Route::get('/regions/desa/{kode_desa}', [RegionController::class, 'showByDesa']);

    // Endpoint v1 akan diaktifkan setelah Controller & Model diisi:

    // Route::apiResource('indicators', \App\Http\Controllers\Api\V1\IndicatorController::class);
    // Route::post('smart-matching', [\App\Http\Controllers\Api\V1\SmartMatchingController::class, 'match']);
    // Route::get('recommendations', [\App\Http\Controllers\Api\V1\RecommendationController::class, 'index']);
});

Route::prefix('map')->group(function () {
    Route::get('/desa', [MapController::class, 'desaGeojson']);
    Route::get('/faskes', [MapController::class, 'faskesGeojson']);
    Route::get('/sekolah', [MapController::class, 'sekolahGeojson']);
    Route::get('/kabupaten', [MapController::class, 'kabupatenGeojson']);
    Route::post('/cek-desa', [MapController::class, 'cekDesaByKoordinat']);
    Route::get('/fasilitas-desa/{kode_desa}', [MapController::class, 'fasilitasDesa']);
});