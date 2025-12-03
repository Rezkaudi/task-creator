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

            if (!description || typeof description !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Description is required and must be a string",
                });
                return;
            }

            if (!designJson) {
                res.status(400).json({
                    success: false,
                    message: "Design JSON is required",
                });
                return;
            }

            const version = await this.saveDesignVersionUseCase.execute(
                description,
                designJson
            );

            console.log(`✅ Saved design version ${version.version}: ${description}`);

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
            const versions = await this.getAllDesignVersionsUseCase.execute();

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
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid version ID",
                });
                return;
            }

            const version = await this.getDesignVersionByIdUseCase.execute(id);

            if (!version) {
                res.status(404).json({
                    success: false,
                    message: `Design version with id ${id} not found`,
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
            const id = parseInt(req.params.id);

            if (isNaN(id)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid version ID",
                });
                return;
            }

            await this.deleteDesignVersionUseCase.execute(id);

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
