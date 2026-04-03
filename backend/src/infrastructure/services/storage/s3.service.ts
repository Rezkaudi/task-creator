import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ENV_CONFIG } from '../../config/env.config';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES: Record<string, { extension: string; magic: Buffer[] }> = {
    'image/png': {
        extension: 'png',
        magic: [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    },
    'image/jpeg': {
        extension: 'jpg',
        magic: [Buffer.from([0xff, 0xd8, 0xff])],
    },
    'image/webp': {
        extension: 'webp',
        // RIFF????WEBP — bytes 0-3 are RIFF, bytes 8-11 are WEBP
        magic: [Buffer.from([0x52, 0x49, 0x46, 0x46])],
    },
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function validateImageBuffer(buffer: Buffer, mimeType: string): void {
    if (buffer.length > MAX_SIZE_BYTES) {
        throw new Error(`File size ${buffer.length} exceeds the 5 MB limit`);
    }

    const spec = ALLOWED_MIME_TYPES[mimeType];
    if (!spec) {
        throw new Error(`MIME type "${mimeType}" is not allowed. Allowed types: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`);
    }

    const matchesMagic = spec.magic.some(magic => buffer.slice(0, magic.length).equals(magic));

    // WebP requires an additional check on bytes 8-11
    if (mimeType === 'image/webp') {
        const webpMarker = buffer.slice(8, 12).toString('ascii');
        if (!matchesMagic || webpMarker !== 'WEBP') {
            throw new Error('File content does not match declared MIME type image/webp');
        }
    } else if (!matchesMagic) {
        throw new Error(`File content does not match declared MIME type ${mimeType}`);
    }
}

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
        const matches = base64DataUrl.match(/^data:([a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]+\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]+);base64,([A-Za-z0-9+/]+=*)$/);
        if (!matches) {
            throw new Error('Invalid base64 image format. Expected: data:<mime>;base64,<data>');
        }

        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        validateImageBuffer(buffer, mimeType);

        const extension = ALLOWED_MIME_TYPES[mimeType].extension;
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
