import { DataSource } from "typeorm";
import { DesignVersionEntity } from "./entities/design-version.typeorm-entity";
import { ENV_CONFIG } from "../config/env.config";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: ENV_CONFIG.DATABASE_URL,
    synchronize: false,
    logging: ENV_CONFIG.NODE_ENV === "development",
    entities: [DesignVersionEntity],
    migrations: ENV_CONFIG.NODE_ENV === "development"
        ? ["src/infrastructure/database/migrations/*.ts"]
        : ["dist/src/infrastructure/database/migrations/*.js"],
    subscribers: [],
});

export const initializeDatabase = async (): Promise<DataSource> => {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("✅ Database connection established");
        }
        return AppDataSource;
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        throw error;
    }
};
