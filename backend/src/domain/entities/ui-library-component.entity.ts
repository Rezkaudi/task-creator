export interface UILibraryComponent {
    id: string;
    projectId: string;
    userId: string;
    name: string;
    description: string;
    designJson: any;
    previewImage?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
