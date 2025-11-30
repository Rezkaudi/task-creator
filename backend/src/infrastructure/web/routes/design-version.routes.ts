import { Router } from "express";
import { DesignVersionController } from "../controllers/design-version.controller";

const designVersionRoutes = (designVersionController: DesignVersionController): Router => {
    const router = Router();

    // Save a new design version
    router.post("/", (req, res, next) =>
        designVersionController.saveVersion(req, res, next)
    );

    // Get all design versions (metadata only, without full JSON)
    router.get("/", (req, res, next) =>
        designVersionController.getAllVersions(req, res, next)
    );

    // Get a specific design version by ID (includes full JSON)
    router.get("/:id", (req, res, next) =>
        designVersionController.getVersionById(req, res, next)
    );

    // Delete a design version
    router.delete("/:id", (req, res, next) =>
        designVersionController.deleteVersion(req, res, next)
    );

    return router;
};

export default designVersionRoutes;
