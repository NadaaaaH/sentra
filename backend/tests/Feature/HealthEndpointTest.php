<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    public function test_root_returns_success_json_for_hosted_backend_check(): void
    {
        $this->getJson('/')
            ->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('message', 'SENTRA API is running')
            ->assertJsonPath('data.health', url('/api/v1/ping'));
    }
}
