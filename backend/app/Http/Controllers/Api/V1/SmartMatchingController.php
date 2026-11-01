<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\SmartMatchingRequest;
use App\Services\SmartMatchingService;
use Illuminate\Http\JsonResponse;

class SmartMatchingController extends Controller
{
    public function __construct(private readonly SmartMatchingService $smartMatchingService) {}

    public function categories(): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Daftar bidang program berhasil dimuat',
            'data' => $this->smartMatchingService->availableProgramCategories(),
        ]);
    }

    public function match(SmartMatchingRequest $request): JsonResponse
    {
        $result = $this->smartMatchingService->processSmartMatching($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => $result['message'],
            'data' => $result['matches'],
        ]);
    }
}
