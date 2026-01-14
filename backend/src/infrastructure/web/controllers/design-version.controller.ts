// File: /backend/src/infrastructure/web/controllers/design-version.controller.ts

import { NextFunction, Request, Response } from "express";
import { SaveDesignVersionUseCase } from "../../../application/use-cases/save-design-version.use-case";
import { GetAllDesignVersionsUseCase } from "../../../application/use-cases/get-all-design-versions.use-case";
import { GetDesignVersionByIdUseCase } from "../../../application/use-cases/get-design-version-by-id.use-case";
import { DeleteDesignVersionUseCase } from "../../../application/use-cases/delete-design-version.use-case";

export class DesignVersionController {
    constructor(
        private readonly saveDesignVersionUseCase: SaveDesignVersionUseCase,
        private readonly getAllDesignVersionsUseCase: GetAllDesignVersionsUseCase,
        private readonly getDesignVersionByIdUseCase: GetDesignVersionByIdUseCase,
        private readonly deleteDesignVersionUseCase: DeleteDesignVersionUseCase
    ) { }

    async saveVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { description, designJson } = req.body;
            const userId = (req as any).user.id;

            const version = await this.saveDesignVersionUseCase.execute(description, designJson, userId);

            console.log(`✅ Saved design version ${version.version} for user ${userId}: ${description}`);

            res.status(201).json({
                success: true,
                version,
                message: `Design saved as version ${version.version}`,
            });
        } catch (error) {
            console.error("Error saving design version:", error);
            next(error);
        }
    }

    async getAllVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const versions = await this.getAllDesignVersionsUseCase.execute(userId);

            res.json({
                success: true,
                versions,
                message: `Found ${versions.length} design versions`,
            });
        } catch (error) {
            console.error("Error getting design versions:", error);
            next(error);
        }
    }

    async getVersionById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id;
            const userId = (req as any).user.id;

            const version = await this.getDesignVersionByIdUseCase.execute(id, userId);

            if (!version) {
                res.status(404).json({
                    success: false,
                    message: `Design version with id ${id} not found or you don't have permission to access it`,
                });
                return;
            }

            res.json({
                success: true,
                version,
            });
        } catch (error) {
            console.error("Error getting design version:", error);
            next(error);
        }
    }

    async deleteVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = req.params.id;
            const userId = (req as any).user.id;

            await this.deleteDesignVersionUseCase.execute(id, userId);

            res.json({
                success: true,
                message: `Design version ${id} deleted successfully`,
            });
        } catch (error) {
            console.error("Error deleting design version:", error);
            next(error);
        }
    }
}