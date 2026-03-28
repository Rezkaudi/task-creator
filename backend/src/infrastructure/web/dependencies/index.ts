// src/infrastructure/web/dependencies/index.ts

// Services
import { IconService } from "../../services/ai/icon.service";
import { JsonToToonService } from "../../services/ai/json-to-toon.service";
import { OpenAIClientFactory } from "../../services/ai/openai-client.factory";
import { MessageBuilderService } from "../../services/ai/message-builder.service";
import { ResponseParserService } from "../../services/ai/response-parser.service";
import { ToolCallHandlerService } from "../../services/ai/tool-call-handler.service";
import { AiGenerateDesignService } from "../../services/ai/ai-generate-design.service";
import { AiCostCalculatorService } from "../../services/ai/ai-cost.calculator.service";
import { GoogleAuthService } from "../../services/auth/google-auth.service";
import { TokenStoreService } from "../../services/auth/token-store.service";
import { PointsService } from "../../services/payment/points.service";
import { StripeService } from "../../services/payment/stripe.service";
import { JwtService } from "../../services/auth/jwt.service";
import { S3Service } from "../../services/storage/s3.service";
import { IconExtractorService } from "../../services/ai/icon-extractor.service";
import { IconPostProcessorService } from "../../services/ai/icon-post-processor.service";
import { PinnedComponentExtractorService } from "../../services/ai/pinned-component-extractor.service";
import { PinnedComponentPostProcessorService } from "../../services/ai/pinned-component-post-processor.service";


// Repositories
import { TypeORMUserRepository } from "../../repository/typeorm-user.repository";
import { TypeORMClientErrorRepository } from "../../repository/typeorm-client-error.repository";
import { TypeORMUILibraryRepository } from "../../repository/typeorm-ui-library.repository";
import { TypeORMPaymentTransactionRepository } from "../../repository/typeorm-payment-transaction.repository";
import { TypeORMSubscriptionRepository } from "../../repository/typeorm-subscription.repository";
import { TypeORMDesignGenerationRepository } from "../../repository/typeorm-design-generation.repository";


// Use Cases - Design
import { EditDesignWithAIUseCase } from "../../../application/use-cases/design/edit-design-with-ai.use-case";
import { GeneratePrototypeConnectionsUseCase } from "../../../application/use-cases/design/generate-prototype-connections.use-case";
import { GenerateDesignBasedOnExistingUseCase } from "../../../application/use-cases/design/generate-design-based-on-existing.use-case";
import { GenerateDesignFromConversationUseCase } from "../../../application/use-cases/design/generate-design-from-conversation.use-case";

// Use Cases - UI Library
import { CreateUILibraryProjectUseCase } from "../../../application/use-cases/ui-library/create-ui-library-project.use-case";
import { GetUILibraryProjectsUseCase } from "../../../application/use-cases/ui-library/get-ui-library-projects.use-case";
import { DeleteUILibraryProjectUseCase } from "../../../application/use-cases/ui-library/delete-ui-library-project.use-case";
import { CreateUILibraryComponentUseCase } from "../../../application/use-cases/ui-library/create-ui-library-component.use-case";
import { GetUILibraryComponentsByProjectUseCase } from "../../../application/use-cases/ui-library/get-ui-library-components-by-project.use-case";
import { DeleteUILibraryComponentUseCase } from "../../../application/use-cases/ui-library/delete-ui-library-component.use-case";
import { UploadComponentImageUseCase } from "../../../application/use-cases/ui-library/upload-component-image.use-case";

// Use Cases - Auth
import { GoogleSignInUseCase } from "../../../application/use-cases/auth/google-sign-in.use-case";

// Use Cases - Payment
import { CreateCheckoutSessionUseCase } from "../../../application/use-cases/payment/create-checkout-session.use-case";
import { HandleStripeWebhookUseCase } from "../../../application/use-cases/payment/handle-stripe-webhook.use-case";
import { GetUserBalanceUseCase } from "../../../application/use-cases/payment/get-user-balance.use-case";
import { GetPaymentHistoryUseCase } from "../../../application/use-cases/payment/get-payment-history.use-case";
import { GetAvailablePackagesUseCase } from "../../../application/use-cases/payment/get-available-packages.use-case";
import { PollPaymentStatusUseCase } from "../../../application/use-cases/payment/poll-payment-status.use-case";

// Use Cases - Subscriptions
import { CreateSubscriptionCheckoutUseCase } from "../../../application/use-cases/subscription/create-subscription-checkout.use-case";
import { CancelSubscriptionUseCase } from "../../../application/use-cases/subscription/cancel-subscription.use-case";
import { GetSubscriptionStatusUseCase } from "../../../application/use-cases/subscription/get-subscription-status.use-case";
import { GetAvailableSubscriptionPlansUseCase } from "../../../application/use-cases/subscription/get-available-subscription-plans.use-case";

// Use Cases - Client Errors
import { ReportClientErrorUseCase } from "../../../application/use-cases/client-error/report-client-error.use-case";

// Use Cases - Design Generations
import { SaveDesignGenerationUseCase } from "../../../application/use-cases/design-generation/save-design-generation.use-case";
import { GetUserGenerationsUseCase } from "../../../application/use-cases/design-generation/get-user-generations.use-case";
import { GetGenerationByIdUseCase } from "../../../application/use-cases/design-generation/get-generation-by-id.use-case";
import { DeleteGenerationUseCase } from "../../../application/use-cases/design-generation/delete-generation.use-case";

// Controllers
import { DesignController } from "../controllers/design.controller";
import { AIModelsController } from "../controllers/ai-models.controller";
import { ClientErrorController } from "../controllers/client-error.controller";
import { DesignSystemsController } from "../controllers/design-systems.controller";
import { UILibraryController } from "../controllers/ui-library.controller";
import { AuthController } from "../controllers/auth.controller";
import { PaymentController } from "../controllers/payment.controller";
import { SubscriptionController } from "../controllers/subscription.controller";
import { DesignGenerationController } from "../controllers/design-generation.controller";

import { AuthMiddleware } from "../middleware/auth.middleware";



export const setupDependencies = () => {

    // Repositories
    const jsonToToonService = new JsonToToonService();
    const userRepository = new TypeORMUserRepository();
    const uiLibraryRepository = new TypeORMUILibraryRepository();
    const clientErrorRepository = new TypeORMClientErrorRepository();
    const paymentTransactionRepository = new TypeORMPaymentTransactionRepository();
    const subscriptionRepository = new TypeORMSubscriptionRepository();
    const designGenerationRepository = new TypeORMDesignGenerationRepository();


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
    const s3Service = new S3Service();
    const iconExtractorService = new IconExtractorService();
    const iconPostProcessorService = new IconPostProcessorService(iconExtractorService);
    const pinnedComponentExtractorService = new PinnedComponentExtractorService();
    const pinnedComponentPostProcessorService = new PinnedComponentPostProcessorService();

    const defaultAiDesignService = new AiGenerateDesignService(
        aiCostCalculatorService,
        clientFactory,
        toolCallHandler,
        responseParser,
        messageBuilder,
        s3Service,
    );

    const generateDesignFromConversationUseCase = new GenerateDesignFromConversationUseCase(defaultAiDesignService);
    const editDesignWithAIUseCase = new EditDesignWithAIUseCase(defaultAiDesignService);
    const generateDesignBasedOnExistingUseCase = new GenerateDesignBasedOnExistingUseCase(
        defaultAiDesignService,
        jsonToToonService,
        iconExtractorService,
        iconPostProcessorService,
        pinnedComponentExtractorService,
        pinnedComponentPostProcessorService
    );

    const generatePrototypeConnectionsUseCase = new GeneratePrototypeConnectionsUseCase(
        defaultAiDesignService
    );

    const createUILibraryProjectUseCase = new CreateUILibraryProjectUseCase(uiLibraryRepository);
    const getUILibraryProjectsUseCase = new GetUILibraryProjectsUseCase(uiLibraryRepository);
    const deleteUILibraryProjectUseCase = new DeleteUILibraryProjectUseCase(uiLibraryRepository);
    const createUILibraryComponentUseCase = new CreateUILibraryComponentUseCase(uiLibraryRepository);
    const getUILibraryComponentsByProjectUseCase = new GetUILibraryComponentsByProjectUseCase(uiLibraryRepository);
    const deleteUILibraryComponentUseCase = new DeleteUILibraryComponentUseCase(uiLibraryRepository, s3Service);
    const uploadComponentImageUseCase = new UploadComponentImageUseCase(s3Service);

    // Use Cases - Client Errors
    const reportClientErrorUseCase = new ReportClientErrorUseCase(clientErrorRepository);

    // Use Cases - Design Generations
    const saveDesignGenerationUseCase = new SaveDesignGenerationUseCase(designGenerationRepository);
    const getUserGenerationsUseCase = new GetUserGenerationsUseCase(designGenerationRepository);
    const getGenerationByIdUseCase = new GetGenerationByIdUseCase(designGenerationRepository);
    const deleteGenerationUseCase = new DeleteGenerationUseCase(designGenerationRepository);

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
        saveDesignGenerationUseCase,
    );

    const uiLibraryController = new UILibraryController(
        createUILibraryProjectUseCase,
        getUILibraryProjectsUseCase,
        deleteUILibraryProjectUseCase,
        createUILibraryComponentUseCase,
        getUILibraryComponentsByProjectUseCase,
        deleteUILibraryComponentUseCase,
        uploadComponentImageUseCase,
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

    const designGenerationController = new DesignGenerationController(
        getUserGenerationsUseCase,
        getGenerationByIdUseCase,
        deleteGenerationUseCase,
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
        designGenerationController,
    };
};
