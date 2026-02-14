import { Request, Response } from "express";
import { CreateSubscriptionCheckoutUseCase } from "../../../application/use-cases/create-subscription-checkout.use-case";
import { CancelSubscriptionUseCase } from "../../../application/use-cases/cancel-subscription.use-case";
import { GetSubscriptionStatusUseCase } from "../../../application/use-cases/get-subscription-status.use-case";
import { GetAvailableSubscriptionPlansUseCase } from "../../../application/use-cases/get-available-subscription-plans.use-case";

export class SubscriptionController {
    constructor(
        private readonly createSubscriptionCheckoutUseCase: CreateSubscriptionCheckoutUseCase,
        private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
        private readonly getSubscriptionStatusUseCase: GetSubscriptionStatusUseCase,
        private readonly getAvailableSubscriptionPlansUseCase: GetAvailableSubscriptionPlansUseCase,
    ) {}

    createCheckout = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const { planId } = req.body || {};

            if (!user?.id) {
                res.status(401).json({ success: false, message: "Authentication required" });
                return;
            }

            if (!planId || typeof planId !== "string") {
                res.status(400).json({ success: false, message: "planId is required" });
                return;
            }

            const result = await this.createSubscriptionCheckoutUseCase.execute(user.id, planId);
            res.status(200).json({
                success: true,
                sessionId: result.sessionId,
                checkoutUrl: result.checkoutUrl,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create subscription checkout";
            res.status(400).json({ success: false, message });
        }
    };

    cancel = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;

            if (!user?.id) {
                res.status(401).json({ success: false, message: "Authentication required" });
                return;
            }

            const result = await this.cancelSubscriptionUseCase.execute(user.id);
            res.status(200).json({
                success: true,
                message: "Subscription will be canceled at end of billing period",
                ...result,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to cancel subscription";
            res.status(400).json({ success: false, message });
        }
    };

    getStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;

            if (!user?.id) {
                res.status(401).json({ success: false, message: "Authentication required" });
                return;
            }

            const result = await this.getSubscriptionStatusUseCase.execute(user.id);
            res.status(200).json({ success: true, ...result });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to get subscription status";
            res.status(400).json({ success: false, message });
        }
    };

    getPlans = async (_req: Request, res: Response): Promise<void> => {
        try {
            const plans = this.getAvailableSubscriptionPlansUseCase.execute();
            res.status(200).json({ success: true, plans });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to get subscription plans";
            res.status(400).json({ success: false, message });
        }
    };
}
