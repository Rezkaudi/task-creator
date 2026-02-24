// src/infrastructure/web/dependencies/index.ts

// Services
import { IconService } from "../../services/icon.service";
import { JsonToToonService } from "../../services/json-to-toon.service";
import { OpenAIClientFactory } from "../../services/openai-client.factory";
import { MessageBuilderService } from "../../services/message-builder.service";
import { ResponseParserService } from "../../services/response-parser.service";
import { ToolCallHandlerService } from "../../services/tool-call-handler.service";
import { AiGenerateDesignService } from "../../services/ai-generate-design.service";
import { AiCostCalculatorService } from "../../services/ai-cost.calculator.service";
import { GoogleAuthService } from "../../services/google-auth.service";
import { TokenStoreService } from "../../services/token-store.service";
import { PointsService } from "../../services/points.service";
import { StripeService } from "../../services/stripe.service";
import { JwtService } from "../../services/jwt.service";


// Repositories
import { TypeORMUserRepository } from "../../repository/typeorm-user.repository";
import { TypeORMClientErrorRepository } from "../../repository/typeorm-client-error.repository";
import { TypeORMUILibraryRepository } from "../../repository/typeorm-ui-library.repository";
import { TypeORMPaymentTransactionRepository } from "../../repository/typeorm-payment-transaction.repository";
import { TypeORMSubscriptionRepository } from "../../repository/typeorm-subscription.repository";


// Use Cases - Design
import { EditDesignWithAIUseCase } from "../../../application/use-cases/edit-design-with-ai.use-case";
import { GeneratePrototypeConnectionsUseCase } from "../../../application/use-cases/generate-prototype-connections.use-case";
import { GenerateDesignBasedOnExistingUseCase } from "../../../application/use-cases/generate-design-based-on-existing.use-case";
import { GenerateDesignFromConversationUseCase } from "../../../application/use-cases/generate-design-from-conversation.use-case";

import { CreateUILibraryProjectUseCase } from "../../../application/use-cases/create-ui-library-project.use-case";
import { GetUILibraryProjectsUseCase } from "../../../application/use-cases/get-ui-library-projects.use-case";
import { DeleteUILibraryProjectUseCase } from "../../../application/use-cases/delete-ui-library-project.use-case";
import { CreateUILibraryComponentUseCase } from "../../../application/use-cases/create-ui-library-component.use-case";
import { GetUILibraryComponentsByProjectUseCase } from "../../../application/use-cases/get-ui-library-components-by-project.use-case";
import { DeleteUILibraryComponentUseCase } from "../../../application/use-cases/delete-ui-library-component.use-case";

// Use Cases - Auth
import { GoogleSignInUseCase } from "../../../application/use-cases/google-sign-in.use-case";
import { CreateCheckoutSessionUseCase } from "../../../application/use-cases/create-checkout-session.use-case";
import { HandleStripeWebhookUseCase } from "../../../application/use-cases/handle-stripe-webhook.use-case";
import { GetUserBalanceUseCase } from "../../../application/use-cases/get-user-balance.use-case";
import { GetPaymentHistoryUseCase } from "../../../application/use-cases/get-payment-history.use-case";
import { GetAvailablePackagesUseCase } from "../../../application/use-cases/get-available-packages.use-case";
import { PollPaymentStatusUseCase } from "../../../application/use-cases/poll-payment-status.use-case";

// Use Cases - Subscriptions
import { CreateSubscriptionCheckoutUseCase } from "../../../application/use-cases/create-subscription-checkout.use-case";
import { CancelSubscriptionUseCase } from "../../../application/use-cases/cancel-subscription.use-case";
import { GetSubscriptionStatusUseCase } from "../../../application/use-cases/get-subscription-status.use-case";
import { GetAvailableSubscriptionPlansUseCase } from "../../../application/use-cases/get-available-subscription-plans.use-case";

// Use Cases - Client Errors
import { ReportClientErrorUseCase } from "../../../application/use-cases/report-client-error.use-case";

// Controllers
import { DesignController } from "../controllers/design.controller";
import { AIModelsController } from "../controllers/ai-models.controller";
import { ClientErrorController } from "../controllers/client-error.controller";
import { DesignSystemsController } from "../controllers/design-systems.controller";
import { UILibraryController } from "../controllers/ui-library.controller";
import { AuthController } from "../controllers/auth.controller";
import { PaymentController } from "../controllers/payment.controller";
import { SubscriptionController } from "../controllers/subscription.controller";

import { AuthMiddleware } from "../middleware/auth.middleware";



export const setupDependencies = () => {

    // Repositories
    const jsonToToonService = new JsonToToonService();
    const userRepository = new TypeORMUserRepository();
    const uiLibraryRepository = new TypeORMUILibraryRepository();
    const clientErrorRepository = new TypeORMClientErrorRepository();
    const paymentTransactionRepository = new TypeORMPaymentTransactionRepository();
    const subscriptionRepository = new TypeORMSubscriptionRepository();


    // Services
    const aiCostCalculatorService = new AiCostCalculatorService()
    const iconService = new IconService();
    const clientFactory = new OpenAIClientFactory();
    const toolCallHandler = new ToolCallHandlerService(iconService);
    const responseParser = new ResponseParserService();
    const messageBuilder = new MessageBuilderService();
    const stripeService = new StripeService();
    const pointsService = new PointsService(userRepository);
    const jwtService = new JwtService();

    const defaultAiDesignService = new AiGenerateDesignService(
        aiCostCalculatorService,
        clientFactory,
        toolCallHandler,
        responseParser,
        messageBuilder,
    );

    const generateDesignFromConversationUseCase = new GenerateDesignFromConversationUseCase(defaultAiDesignService);
    const editDesignWithAIUseCase = new EditDesignWithAIUseCase(defaultAiDesignService);
    const generateDesignBasedOnExistingUseCase = new GenerateDesignBasedOnExistingUseCase(
        defaultAiDesignService,
        jsonToToonService
    );

    const generatePrototypeConnectionsUseCase = new GeneratePrototypeConnectionsUseCase(
        defaultAiDesignService
    );

    const createUILibraryProjectUseCase = new CreateUILibraryProjectUseCase(uiLibraryRepository);
    const getUILibraryProjectsUseCase = new GetUILibraryProjectsUseCase(uiLibraryRepository);
    const deleteUILibraryProjectUseCase = new DeleteUILibraryProjectUseCase(uiLibraryRepository);
    const createUILibraryComponentUseCase = new CreateUILibraryComponentUseCase(uiLibraryRepository);
    const getUILibraryComponentsByProjectUseCase = new GetUILibraryComponentsByProjectUseCase(uiLibraryRepository);
    const deleteUILibraryComponentUseCase = new DeleteUILibraryComponentUseCase(uiLibraryRepository);

    // Use Cases - Client Errors
    const reportClientErrorUseCase = new ReportClientErrorUseCase(clientErrorRepository);

    // Auth Services & Use Cases
    const googleAuthService = new GoogleAuthService();
    const tokenStoreService = new TokenStoreService();
    const googleSignInUseCase = new GoogleSignInUseCase(googleAuthService, userRepository);

    const createCheckoutSessionUseCase = new CreateCheckoutSessionUseCase(
        userRepository,
        paymentTransactionRepository,
        stripeService
    );
    const handleStripeWebhookUseCase = new HandleStripeWebhookUseCase(
        userRepository,
        paymentTransactionRepository,
        subscriptionRepository,
        stripeService
    );
    const getUserBalanceUseCase = new GetUserBalanceUseCase(userRepository);
    const getPaymentHistoryUseCase = new GetPaymentHistoryUseCase(paymentTransactionRepository);
    const getAvailablePackagesUseCase = new GetAvailablePackagesUseCase();
    const pollPaymentStatusUseCase = new PollPaymentStatusUseCase(paymentTransactionRepository, userRepository);

    // Subscription Use Cases
    const createSubscriptionCheckoutUseCase = new CreateSubscriptionCheckoutUseCase(
        userRepository,
        subscriptionRepository,
        stripeService
    );
    const cancelSubscriptionUseCase = new CancelSubscriptionUseCase(
        subscriptionRepository,
        stripeService
    );
    const getSubscriptionStatusUseCase = new GetSubscriptionStatusUseCase(subscriptionRepository);
    const getAvailableSubscriptionPlansUseCase = new GetAvailableSubscriptionPlansUseCase();

    const authMiddleware = new AuthMiddleware(userRepository, jwtService);

    const authController = new AuthController(googleSignInUseCase, tokenStoreService);

    const designController = new DesignController(
        generateDesignFromConversationUseCase,
        editDesignWithAIUseCase,
        generateDesignBasedOnExistingUseCase,
        generatePrototypeConnectionsUseCase,
        pointsService,
        userRepository,
        subscriptionRepository,
    );

    const uiLibraryController = new UILibraryController(
        createUILibraryProjectUseCase,
        getUILibraryProjectsUseCase,
        deleteUILibraryProjectUseCase,
        createUILibraryComponentUseCase,
        getUILibraryComponentsByProjectUseCase,
        deleteUILibraryComponentUseCase
    );

    // AI Models Controller
    const aiModelsController = new AIModelsController();
    const designSystemsController = new DesignSystemsController();

    // Client Error Controller
    const clientErrorController = new ClientErrorController(reportClientErrorUseCase);
    const paymentController = new PaymentController(
        createCheckoutSessionUseCase,
        handleStripeWebhookUseCase,
        getUserBalanceUseCase,
        getPaymentHistoryUseCase,
        getAvailablePackagesUseCase,
        pollPaymentStatusUseCase,
    );

    const subscriptionController = new SubscriptionController(
        createSubscriptionCheckoutUseCase,
        cancelSubscriptionUseCase,
        getSubscriptionStatusUseCase,
        getAvailableSubscriptionPlansUseCase,
    );

    return {
        designController,
        uiLibraryController,
        aiModelsController,
        designSystemsController,
        clientErrorController,
        paymentController,
        subscriptionController,
        authMiddleware,
        authController,
    };
};
