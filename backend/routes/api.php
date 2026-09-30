<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

    // Endpoint v1 akan diaktifkan setelah Controller & Model diisi:
    // Route::apiResource('regions', \App\Http\Controllers\Api\V1\RegionController::class);
    // Route::apiResource('indicators', \App\Http\Controllers\Api\V1\IndicatorController::class);
    // Route::post('smart-matching', [\App\Http\Controllers\Api\V1\SmartMatchingController::class, 'match']);
    // Route::get('recommendations', [\App\Http\Controllers\Api\V1\RecommendationController::class, 'index']);
});
