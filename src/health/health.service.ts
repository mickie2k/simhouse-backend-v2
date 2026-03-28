import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
    getHealth() {
        return {
            status: 'healthy',
            service: 'simhouse-backend',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    }
}
