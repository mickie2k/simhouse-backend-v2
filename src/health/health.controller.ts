import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@Controller('health')
@ApiTags('health')
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    @ApiOperation({ summary: 'Get application health status' })
    @ApiResponse({
        status: 200,
        description: 'Application is healthy',
        schema: {
            example: {
                status: 'healthy',
                service: 'simhouse-backend',
                timestamp: '2026-03-28T10:00:00.000Z',
                uptime: 123.456,
            },
        },
    })
    getHealth() {
        return this.healthService.getHealth();
    }
}
