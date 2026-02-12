// src/infrastructure/web/dependencies/index.ts

// Services
import { IconService } from "../../services/icon.service";
import { TrelloService } from "../../services/trello.service";
import { JsonToToonService } from "../../services/json-to-toon.service";
import { OpenAIClientFactory } from "../../services/openai-client.factory";
import { MessageBuilderService } from "../../services/message-builder.service";
import { ResponseParserService } from "../../services/response-parser.service";
import { AiExtractTasksService } from "../../services/ai-extract-tasks.service";
import { ToolCallHandlerService } from "../../services/tool-call-handler.service";
import { AiGenerateDesignService } from "../../services/ai-generate-design.service";
import { AiCostCalculatorService } from "../../services/ai-cost.calculator.service";
import { GoogleAuthService } from "../../services/google-auth.service";
import { TokenStoreService } from "../../services/token-store.service";


// Repositories
import { TypeORMUserRepository } from "../../repository/typeorm-user.repository";
import { TypeORMClientErrorRepository } from "../../repository/typeorm-client-error.repository";
import { TypeORMUILibraryRepository } from "../../repository/typeorm-ui-library.repository";


// Use Cases - Tasks
import { ExtractTasksUseCase } from "../../../application/use-cases/extract-tasks.use-case";
import { AddTasksToTrelloUseCase } from "../../../application/use-cases/add-tasks-to-trello.use-case";
import { GetBoardListsUseCase } from "../../../application/use-cases/get-board-lists-in-trello.use-case";

// Use Cases - Design
import { GenerateDesignUseCase } from "../../../application/use-cases/generate-design.use-case";
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
import { VerifySessionUseCase } from "../../../application/use-cases/verify-session.use-case";

// Use Cases - Client Errors
import { ReportClientErrorUseCase } from "../../../application/use-cases/report-client-error.use-case";

// Controllers
import { TaskController } from "../controllers/task.controller";
import { TrelloController } from "../controllers/trello.controller";
import { DesignController } from "../controllers/design.controller";
import { AIModelsController } from "../controllers/ai-models.controller";
import { ClientErrorController } from "../controllers/client-error.controller";
import { DesignSystemsController } from "../controllers/design-systems.controller";
import { UILibraryController } from "../controllers/ui-library.controller";
import { AuthController } from "../controllers/auth.controller";

import { AuthMiddleware } from "../middleware/auth.middleware";




export const setupDependencies = () => {

    // Repositories
    const jsonToToonService = new JsonToToonService();
    const userRepository = new TypeORMUserRepository();
    const uiLibraryRepository = new TypeORMUILibraryRepository();
    const clientErrorRepository = new TypeORMClientErrorRepository();


    // Services
    const trelloService = new TrelloService();
    const aiCostCalculatorService = new AiCostCalculatorService()
    const iconService = new IconService();
    const clientFactory = new OpenAIClientFactory();
    const toolCallHandler = new ToolCallHandlerService(iconService);
    const responseParser = new ResponseParserService();
    const messageBuilder = new MessageBuilderService();

    const aiExtractTasksService = new AiExtractTasksService(aiCostCalculatorService);

    const defaultAiDesignService = new AiGenerateDesignService(
        aiCostCalculatorService,
        clientFactory,
        toolCallHandler,
        responseParser,
        messageBuilder,
    );

    // Use Cases - Tasks
    const getBoardListsUseCase = new GetBoardListsUseCase(trelloService);
    const extractTasksUseCase = new ExtractTasksUseCase(aiExtractTasksService);
    const addTasksToTrelloUseCase = new AddTasksToTrelloUseCase(trelloService);
    const generateDesignUseCase = new GenerateDesignUseCase(aiExtractTasksService);

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
    const verifySessionUseCase = new VerifySessionUseCase(googleAuthService, userRepository);

    // Controllers
    const trelloController = new TrelloController(getBoardListsUseCase);
    const taskController = new TaskController(extractTasksUseCase, addTasksToTrelloUseCase, generateDesignUseCase);

    const authMiddleware = new AuthMiddleware(userRepository);

    const authController = new AuthController(googleSignInUseCase, verifySessionUseCase, tokenStoreService);

    const designController = new DesignController(
        generateDesignFromConversationUseCase,
        editDesignWithAIUseCase,
        generateDesignBasedOnExistingUseCase,
        generatePrototypeConnectionsUseCase
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



    return {
        taskController,
        trelloController,
        designController,
        uiLibraryController,
        aiModelsController,
        designSystemsController,
        clientErrorController,
        authMiddleware,
        authController,
    };
};
