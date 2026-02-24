import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { access } from 'fs';

@Injectable()
export class StorageService {
    private readonly s3Client: S3Client;
    private readonly bucketName: string;

    constructor(private configService: ConfigService) {
        const region = this.configService.get('AWS_REGION') as string;
        const accessKeyId = this.configService.get(
            'AWS_ACCESS_KEY_ID',
        ) as string;
        const secretAccessKey = this.configService.get(
            'AWS_SECRET_ACCESS_KEY',
        ) as string;

        this.s3Client = new S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            // Performance optimizations
            maxAttempts: 3,
            requestHandler: {
                connectionTimeout: 5000,
                socketTimeout: 5000,
            },
        });
        this.bucketName = this.configService.get('AWS_BUCKET_NAME') as string;
    }

    async generatePresignedUrl(
        filename: string,
        contentType: string,
        fileSize: number,
    ): Promise<{ uploadUrl: string; key: string }> {
        const key = `uploads/${uuidv4()}/${filename}`;

        const command = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: contentType,
            ContentLength: fileSize,
        });

        // Short expiration for security, adequate for upload speed
        const uploadUrl = await getSignedUrl(this.s3Client, command, {
            expiresIn: 900, // 15 minutes
        });

        return { uploadUrl, key };
    }
}
