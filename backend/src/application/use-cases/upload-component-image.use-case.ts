import { S3Service } from '../../infrastructure/services/s3.service';

export class UploadComponentImageUseCase {
    constructor(private readonly s3Service: S3Service) {}

    async execute(base64DataUrl: string): Promise<string> {
        return this.s3Service.uploadBase64Image(base64DataUrl);
    }
}
