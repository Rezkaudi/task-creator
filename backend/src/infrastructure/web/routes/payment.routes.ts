import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";

export default function paymentRoutes(paymentController: PaymentController): Router {
    const router = Router();

    router.post("/create-checkout", paymentController.createCheckoutSession);
    router.post("/webhook", paymentController.handleWebhook);
    router.get("/balance", paymentController.getUserBalance);
    router.get("/history", paymentController.getPaymentHistory);
    router.get("/packages", paymentController.getAvailablePackages);
    router.get("/poll/:sessionId", paymentController.pollPaymentStatus);

    return router;
}
