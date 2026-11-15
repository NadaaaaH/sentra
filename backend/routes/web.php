<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'SENTRA API is running',
        'data' => [
            'api' => url('/api/v1'),
            'health' => url('/api/v1/ping'),
        ],
        'timestamp' => now()->toIso8601String(),
    ]);
});
