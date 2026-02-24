import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

type StorageUserType = 'customer' | 'host';

type AllowedContentType = 'image/jpeg' | 'image/png' | 'image/webp';

interface CreatePresignedUploadUrlParams {
    contentType: AllowedContentType;
    userId: number;
    userType: StorageUserType;
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

    constructor(private readonly configService: ConfigService) {
        const region = this.getRequiredConfig('S3_REGION');
        this.s3Client = new S3Client({ region });
    }

    async createPresignedUploadUrl(
        params: CreatePresignedUploadUrlParams,
    ): Promise<PresignedUploadResult> {
        const bucketName = this.getRequiredConfig('S3_BUCKET');
        const expiresInSeconds = this.getPresignedUrlExpirySeconds();
        const objectKey = this.buildObjectKey(
            params.userType,
            params.userId,
            params.contentType,
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

    private buildObjectKey(
        userType: StorageUserType,
        userId: number,
        contentType: AllowedContentType,
    ): string {
        this.validateContentType(contentType);
        const prefix =
            this.configService.get<string>('S3_AVATAR_PREFIX') ?? 'avatars';
        const extension = this.getFileExtension(contentType);
        const randomId = randomUUID();
        return `${prefix}/${userType}/${userId}/${Date.now()}-${randomId}.${extension}`;
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
        const bucketName = this.getRequiredConfig('S3_BUCKET');
        const region = this.getRequiredConfig('S3_REGION');
        return `https://${bucketName}.s3.${region}.amazonaws.com`;
    }

    private getRequiredConfig(key: string): string {
        const value = this.configService.get<string>(key);
        if (!value) {
            throw new InternalServerErrorException(
                `${key} is not defined in environment variables.`,
            );
        }
        return value;
    }
}
