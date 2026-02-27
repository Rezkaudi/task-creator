import { Router, Request, Response, NextFunction } from 'express';
import { UILibraryController } from '../controllers/ui-library.controller';
import { validateRequest } from '../middleware/validation.middleware';
import {
    createUILibraryProjectValidation,
    createUILibraryComponentValidation,
    uiLibraryIdParamValidation,
    uploadComponentImageValidation,
} from '../validation';


const uiLibraryRoutes = (uiLibraryController: UILibraryController): Router => {
    const router = Router();

    router.post('/projects',
        createUILibraryProjectValidation,
        validateRequest,
        (req: Request, res: Response, next: NextFunction) => uiLibraryController.createProject(req, res, next)
    );

    router.get('/projects',
        (req: Request, res: Response, next: NextFunction) => uiLibraryController.getProjects(req, res, next)
    );

    router.delete('/projects/:id',
        uiLibraryIdParamValidation,
        validateRequest,
        (req: Request, res: Response, next: NextFunction) => uiLibraryController.deleteProject(req, res, next)
    );

    router.get('/projects/:id/components',
        uiLibraryIdParamValidation,
        validateRequest,
        (req: Request, res: Response, next: NextFunction) => uiLibraryController.getComponentsByProject(req, res, next)
    );

    // Must be defined before /components/:id to avoid route conflict
    router.post('/components/upload-image',
        uploadComponentImageValidation,
        validateRequest,
        (req: Request, res: Response, next: NextFunction) => uiLibraryController.uploadImage(req, res, next)
    );

    router.post('/components',
        createUILibraryComponentValidation,
        validateRequest,
        (req: Request, res: Response, next: NextFunction) => uiLibraryController.createComponent(req, res, next)
    );

    router.delete('/components/:id',
        uiLibraryIdParamValidation,
        validateRequest,
        (req: Request, res: Response, next: NextFunction) => uiLibraryController.deleteComponent(req, res, next)
    );

    return router;
};

export default uiLibraryRoutes;
