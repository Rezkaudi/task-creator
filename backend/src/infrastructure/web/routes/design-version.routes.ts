import { Router, Request, Response, NextFunction } from 'express';
import { DesignVersionController } from "../controllers/design-version.controller";
import { saveDesignVersionValidation, designVersionIdParamValidation } from "../validation";
import { validateRequest } from '../middleware/validation.middleware';

const designVersionRoutes = (designVersionController: DesignVersionController): Router => {
    const router = Router();

    // Save a new design version
    router.post("/",
        saveDesignVersionValidation,
        validateRequest,
        (req: Request, res: Response, next: NextFunction) => designVersionController.saveVersion(req, res, next)
    );

    // Get all design versions (metadata only, without full JSON)
    router.get("/", (req, res, next) =>
        designVersionController.getAllVersions(req, res, next)
    );

    // Get a specific design version by ID (includes full JSON)
    router.get("/:id",
        designVersionIdParamValidation,
        validateRequest,
        (req: Request, res: Response, next: NextFunction) => designVersionController.getVersionById(req, res, next)
    );

    // Delete a design version
    router.delete("/:id",
        designVersionIdParamValidation,
        validateRequest,
        (req: Request, res: Response, next: NextFunction) => designVersionController.deleteVersion(req, res, next)
    );

    return router;
};

export default designVersionRoutes;
