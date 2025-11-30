import { DesignVersion } from "../entities/design-version.entity";

export interface IDesignVersionRepository {
    create(designVersion: Partial<DesignVersion>): Promise<DesignVersion>;
    findAll(): Promise<DesignVersion[]>;
    findById(id: number): Promise<DesignVersion | null>;
    findLatest(): Promise<DesignVersion | null>;
    getNextVersion(): Promise<number>;
    delete(id: number): Promise<void>;
}
