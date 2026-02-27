import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ENV_CONFIG } from '../config/env.config';
import { randomUUID } from 'crypto';

export class S3Service {
    private readonly client: S3Client;
    private readonly bucket: string;

    constructor() {
        this.client = new S3Client({
            region: ENV_CONFIG.AWS_REGION,
            credentials: {
                accessKeyId: ENV_CONFIG.AWS_ACCESS_KEY_ID,
                secretAccessKey: ENV_CONFIG.AWS_SECRET_ACCESS_KEY,
            },
            followRegionRedirects: true,
        });
        this.bucket = ENV_CONFIG.AWS_S3_BUCKET;
    }

    async uploadBase64Image(base64DataUrl: string, folder = 'component-previews'): Promise<string> {
        const matches = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
        if (!matches) {
            throw new Error('Invalid base64 image format. Expected: data:<mime>;base64,<data>');
        }

        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const extension = mimeType.split('/')[1] || 'png';
        const key = `${folder}/${randomUUID()}.${extension}`;

        await this.client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        }));

        return `https://${this.bucket}.s3.${ENV_CONFIG.AWS_REGION}.amazonaws.com/${key}`;
    }

    async deleteImageByUrl(url: string): Promise<void> {
        // Extract key from: https://bucket.s3.region.amazonaws.com/folder/uuid.png
        const urlObj = new URL(url);
        const key = urlObj.pathname.slice(1); // remove leading "/"

        await this.client.send(new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        }));
    }
}
