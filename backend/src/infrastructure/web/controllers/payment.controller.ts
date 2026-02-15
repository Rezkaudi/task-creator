import { Request, Response } from "express";
import { CreateCheckoutSessionUseCase } from "../../../application/use-cases/create-checkout-session.use-case";
import { HandleStripeWebhookUseCase } from "../../../application/use-cases/handle-stripe-webhook.use-case";
import { GetUserBalanceUseCase } from "../../../application/use-cases/get-user-balance.use-case";
import { GetPaymentHistoryUseCase } from "../../../application/use-cases/get-payment-history.use-case";
import { GetAvailablePackagesUseCase } from "../../../application/use-cases/get-available-packages.use-case";
import { PollPaymentStatusUseCase } from "../../../application/use-cases/poll-payment-status.use-case";

export class PaymentController {
    constructor(
        private readonly createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
        private readonly handleStripeWebhookUseCase: HandleStripeWebhookUseCase,
        private readonly getUserBalanceUseCase: GetUserBalanceUseCase,
        private readonly getPaymentHistoryUseCase: GetPaymentHistoryUseCase,
        private readonly getAvailablePackagesUseCase: GetAvailablePackagesUseCase,
        private readonly pollPaymentStatusUseCase: PollPaymentStatusUseCase,
    ) { }

    createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const { packageId } = req.body;

            if (!user?.id) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

            if (!packageId || typeof packageId !== "string") {
                res.status(400).json({
                    success: false,
                    message: "packageId is required",
                });
                return;
            }

            const result = await this.createCheckoutSessionUseCase.execute(user.id, packageId);
            res.status(200).json({
                success: true,
                sessionId: result.sessionId,
                checkoutUrl: result.checkoutUrl,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create checkout session";
            res.status(400).json({
                success: false,
                message,
            });
        }
    };

    handleWebhook = async (req: Request, res: Response): Promise<void> => {
        try {
            const signature = req.headers["stripe-signature"];
            if (!signature || typeof signature !== "string") {
                res.status(400).json({
                    success: false,
                    message: "Missing Stripe signature",
                });
                return;
            }

            const rawBody = Buffer.isBuffer(req.body)
                ? (req.body as Buffer)
                : Buffer.from(
                    typeof req.body === "string"
                        ? req.body
                        : JSON.stringify(req.body || {}),
                );
            await this.handleStripeWebhookUseCase.execute(rawBody, signature);

            res.status(200).json({
                success: true,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Webhook processing failed";
            res.status(400).json({
                success: false,
                message,
            });
        }
    };

    getUserBalance = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            if (!user?.id) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

            const balance = await this.getUserBalanceUseCase.execute(user.id);
            res.status(200).json({
                success: true,
                ...balance,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch balance";
            res.status(400).json({
                success: false,
                message,
            });
        }
    };

    getPaymentHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            if (!user?.id) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

            const transactions = await this.getPaymentHistoryUseCase.execute(user.id);
            res.status(200).json({
                success: true,
                transactions,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch payment history";
            res.status(400).json({
                success: false,
                message,
            });
        }
    };

    getAvailablePackages = async (_req: Request, res: Response): Promise<void> => {
        try {
            const packages = this.getAvailablePackagesUseCase.execute();
            res.status(200).json({
                success: true,
                packages,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch packages";
            res.status(400).json({
                success: false,
                message,
            });
        }
    };

    pollPaymentStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = (req as any).user;
            const { sessionId } = req.params;

            if (!user?.id) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
                return;
            }

            const result = await this.pollPaymentStatusUseCase.execute(user.id, sessionId);
            res.status(200).json({
                success: true,
                status: result.status,
                pointsBalance: result.pointsBalance,
                hasPurchased: result.hasPurchased,
                completedAt: result.completedAt,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to poll payment status";
            const statusCode = message.includes("not found") ? 404 : 400;
            res.status(statusCode).json({
                success: false,
                message,
            });
        }
    };
}
