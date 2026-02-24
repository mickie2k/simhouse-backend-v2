import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Provides storage services for file upload workflows.
 */
@Module({
    providers: [StorageService],
    exports: [StorageService],
})
export class StorageModule {}
