import {
    ForbiddenException,
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    HeadObjectCommand,
    S3Client,
    PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

type AllowedContentType = 'image/jpeg' | 'image/png' | 'image/webp';

interface CreatePresignedUploadUrlParams {
    contentType: AllowedContentType;
    path: string;
    prefix?: string;
}

interface PresignedUploadResult {
    uploadUrl: string;
    publicUrl: string;
    objectKey: string;
    expiresInSeconds: number;
}

@Injectable()
export class StorageService {
    private readonly s3Client: S3Client;
    private readonly logger = new Logger(StorageService.name);
    private bucketName: string;
    private region: string;

    constructor(private readonly configService: ConfigService) {
        this.region = this.configService.get('AWS_REGION') as string;
        this.bucketName = this.configService.get('S3_BUCKET') as string;
        if (!this.region || !this.bucketName) {
            throw new InternalServerErrorException(
                'Missing required S3 configuration',
            );
        }

        this.s3Client = new S3Client({
            region: this.region,
            // Performance optimizations
            maxAttempts: 3,
            requestHandler: {
                connectionTimeout: 5000,
                socketTimeout: 5000,
            },
        });
    }

    async createPresignedUploadUrl(
        params: CreatePresignedUploadUrlParams,
    ): Promise<PresignedUploadResult> {
        this.validateContentType(params.contentType);
        const bucketName = this.bucketName;
        const expiresInSeconds = this.getPresignedUrlExpirySeconds();
        const objectKey = this.buildObjectKey(
            params.contentType,
            params.path,
            params.prefix,
        );
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
            ContentType: params.contentType,
        });
        const uploadUrl = await getSignedUrl(this.s3Client, command, {
            expiresIn: expiresInSeconds,
        });
        const publicUrl = this.getPublicUrl(objectKey);
        return { uploadUrl, publicUrl, objectKey, expiresInSeconds };
    }

    getPublicUrl(objectKey: string): string {
        const baseUrl = this.getPublicBaseUrl();
        return `${baseUrl}/${objectKey}`;
    }

    getCdnUrl(objectKey: string): string {
        const baseUrl = this.getCDNBaseUrl();
        return `${baseUrl}/${objectKey}`;
    }

    async assertObjectExists(objectKey: string): Promise<void> {
        const normalizedObjectKey = this.normalizeObjectKey(objectKey);

        try {
            await this.s3Client.send(
                new HeadObjectCommand({
                    Bucket: this.bucketName,
                    Key: normalizedObjectKey,
                }),
            );
        } catch (error) {
            const httpStatus = (
                error as { $metadata?: { httpStatusCode?: number } }
            ).$metadata?.httpStatusCode;
            const message =
                (error as { message?: string }).message || 'Unknown error';
            const trace =
                error instanceof Error ? error.stack : JSON.stringify(error);

            this.logger.error(
                `S3 HeadObject failed for key "${normalizedObjectKey}" with status ${httpStatus ?? 'unknown'}: ${message}`,
                trace,
            );

            if (httpStatus === 404) {
                throw new NotFoundException('Uploaded object not found');
            }

            if (httpStatus === 403) {
                throw new ForbiddenException(
                    'Uploaded object is not accessible. Ensure the request uses objectKey and the server has s3:HeadObject permission.',
                );
            }

            throw new InternalServerErrorException(
                `Failed to verify uploaded object: ${message}`,
            );
        }
    }

    normalizeObjectKey(value: string): string {
        const trimmed = value.trim();
        if (!trimmed) {
            throw new BadRequestException('Invalid object key');
        }

        const normalizedKey = this.extractObjectKeyFromInput(trimmed);
        if (!normalizedKey || normalizedKey.includes('..')) {
            throw new BadRequestException('Invalid object key');
        }

        return normalizedKey;
    }

    private buildObjectKey(
        contentType: AllowedContentType,
        path: string,
        prefix?: string,
    ): string {
        const resolvedPrefix =
            prefix ??
            this.configService.get<string>('S3_AVATAR_PREFIX') ??
            'avatars';
        const normalizedPrefix = this.normalizePath(resolvedPrefix);
        const normalizedPath = this.normalizePath(path);
        if (!normalizedPath) {
            throw new BadRequestException('Invalid upload path');
        }
        const extension = this.getFileExtension(contentType);
        const randomId = randomUUID();
        return `${normalizedPrefix}/${normalizedPath}/${Date.now()}-${randomId}.${extension}`;
    }

    private normalizePath(value: string): string {
        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }
        const normalized = trimmed.replace(/^\/+|\/+$/g, '');
        if (normalized.includes('..')) {
            throw new BadRequestException('Invalid upload path');
        }
        return normalized;
    }

    private validateContentType(contentType: string): void {
        const allowedTypes: AllowedContentType[] = [
            'image/jpeg',
            'image/png',
            'image/webp',
        ];
        if (!allowedTypes.includes(contentType as AllowedContentType)) {
            throw new BadRequestException('Unsupported file type');
        }
    }

    private getFileExtension(contentType: AllowedContentType): string {
        // Record type is for static and run at compile time, so this is safe and efficient
        const extensionMap: Record<AllowedContentType, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
        };
        return extensionMap[contentType];
    }

    private getPresignedUrlExpirySeconds(): number {
        const rawValue = this.configService.get<string>(
            'S3_PRESIGNED_URL_EXPIRES',
        );
        if (!rawValue) {
            return 300;
        }
        const parsed = Number(rawValue);
        if (Number.isNaN(parsed) || parsed <= 0) {
            return 300;
        }
        return parsed;
    }

    private getPublicBaseUrl(): string {
        const baseUrl = this.configService.get<string>('S3_PUBLIC_BASE_URL');
        if (baseUrl && baseUrl.length > 0) {
            return baseUrl.replace(/\/+$/, '');
        }
        const bucketName = this.bucketName;
        const region = this.region;
        return `https://${bucketName}.s3.${region}.amazonaws.com`;
    }

    private getCDNBaseUrl(): string {
        const cdnUrl = this.configService.get<string>('S3_CDN_BASE_URL');
        if (cdnUrl && cdnUrl.length > 0) {
            return cdnUrl.replace(/\/+$/, '');
        }
        return this.getPublicBaseUrl();
    }

    private extractObjectKeyFromInput(value: string): string {
        if (!/^https?:\/\//i.test(value)) {
            return value.replace(/^\/+/, '');
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(value);
        } catch {
            throw new BadRequestException('Invalid object key URL');
        }

        const objectKey = parsedUrl.pathname.replace(/^\/+/, '');
        return decodeURIComponent(objectKey);
    }
}
