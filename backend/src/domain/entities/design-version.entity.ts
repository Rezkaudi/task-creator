export interface DesignVersion {
    id?: number;
    version: number;
    description: string;
    designJson: any;
    createdAt?: Date;
    updatedAt?: Date;
}
