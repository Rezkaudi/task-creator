// src/infrastructure/web/routes/cost.routes.ts
import { Router, Request, Response } from 'express';
import { AiGenerateDesignService } from '../../services/ai-generate-design.service';

const costRoutes = (aiGenerateDesignService: AiGenerateDesignService): Router => {
    const router = Router();

    router.get('/last', (req: Request, res: Response) => {
        try {
            const lastCost = aiGenerateDesignService.getLastCost();
            
            if (!lastCost) {
                return res.status(200).json({
                    success: true,
                    message: 'No cost recorded yet',
                    hasCost: false
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Last cost retrieved',
                hasCost: true,
                cost: lastCost
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error getting cost'
            });
        }
    });

    return router;
};

export default costRoutes;