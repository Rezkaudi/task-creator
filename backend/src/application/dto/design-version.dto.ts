import { DesignVersion } from "../../domain/entities/design-version.entity";

export interface SaveDesignVersionRequest {
    description: string;
    designJson: any;
}

export interface SaveDesignVersionResponse {
    success: boolean;
    version?: DesignVersion;
    message?: string;
}

export interface GetDesignVersionsResponse {
    success: boolean;
    versions: DesignVersion[];
    message?: string;
}

export interface GetDesignVersionByIdResponse {
    success: boolean;
    version?: DesignVersion;
    message?: string;
}

export interface DeleteDesignVersionResponse {
    success: boolean;
    message?: string;
}
