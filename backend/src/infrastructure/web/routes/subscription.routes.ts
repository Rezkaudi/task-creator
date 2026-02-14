import { Router } from "express";
import { SubscriptionController } from "../controllers/subscription.controller";

export default function subscriptionRoutes(subscriptionController: SubscriptionController): Router {
    const router = Router();

    router.post("/create-checkout", subscriptionController.createCheckout);
    router.post("/cancel", subscriptionController.cancel);
    router.get("/status", subscriptionController.getStatus);
    router.get("/plans", subscriptionController.getPlans);

    return router;
}
