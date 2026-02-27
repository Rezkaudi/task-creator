import { NextFunction, Request, Response } from 'express';
import { CreateUILibraryProjectUseCase } from '../../../application/use-cases/create-ui-library-project.use-case';
import { GetUILibraryProjectsUseCase } from '../../../application/use-cases/get-ui-library-projects.use-case';
import { DeleteUILibraryProjectUseCase } from '../../../application/use-cases/delete-ui-library-project.use-case';
import { CreateUILibraryComponentUseCase } from '../../../application/use-cases/create-ui-library-component.use-case';
import { GetUILibraryComponentsByProjectUseCase } from '../../../application/use-cases/get-ui-library-components-by-project.use-case';
import { DeleteUILibraryComponentUseCase } from '../../../application/use-cases/delete-ui-library-component.use-case';
import { UploadComponentImageUseCase } from '../../../application/use-cases/upload-component-image.use-case';

export class UILibraryController {
    constructor(
        private readonly createProjectUseCase: CreateUILibraryProjectUseCase,
        private readonly getProjectsUseCase: GetUILibraryProjectsUseCase,
        private readonly deleteProjectUseCase: DeleteUILibraryProjectUseCase,
        private readonly createComponentUseCase: CreateUILibraryComponentUseCase,
        private readonly getComponentsByProjectUseCase: GetUILibraryComponentsByProjectUseCase,
        private readonly deleteComponentUseCase: DeleteUILibraryComponentUseCase,
        private readonly uploadComponentImageUseCase: UploadComponentImageUseCase,
    ) { }

    async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { name } = req.body;

            const project = await this.createProjectUseCase.execute(name, userId);

            res.status(201).json({
                success: true,
                project,
                message: 'Project created successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const projects = await this.getProjectsUseCase.execute(userId);

            res.json({
                success: true,
                projects,
                message: `Found ${projects.length} projects`,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            await this.deleteProjectUseCase.execute(id, userId);

            res.json({
                success: true,
                message: 'Project deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async createComponent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { projectId, name, description, designJson, previewImage } = req.body;

            const component = await this.createComponentUseCase.execute({
                projectId,
                userId,
                name,
                description,
                designJson,
                previewImage,
            });

            res.status(201).json({
                success: true,
                component,
                message: 'Component saved successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getComponentsByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            const components = await this.getComponentsByProjectUseCase.execute(id, userId);

            res.json({
                success: true,
                components,
                message: `Found ${components.length} components`,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteComponent(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;

            await this.deleteComponentUseCase.execute(id, userId);

            res.json({
                success: true,
                message: 'Component deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { image } = req.body;

            const url = await this.uploadComponentImageUseCase.execute(image);

            res.status(201).json({
                success: true,
                url,
            });
        } catch (error) {
            next(error);
        }
    }
}
