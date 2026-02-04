// src/infrastructure/web/dependencies/index.ts

// Services
import { TrelloService } from "../../services/trello.service";
import { AiExtractTasksService } from "../../services/ai-extract-tasks.service";
import { AiGenerateDesignService } from "../../services/ai-generate-design.service";
import { PromptBuilderService } from "../../services/prompt-builder.service";
import { AiCostCalculatorService } from "../../services/ai-cost.calculator.service";
import { IconService } from "../../services/icon.service";
import { OpenAIClientFactory } from "../../services/openai-client.factory";
import { Timer } from "../../services/timer.service";
import { JsonToToonService } from "../../services/json-to-toon.service";
import { ToolCallHandlerService } from "../../services/tool-call-handler.service";
import { MessageBuilderService } from "../../services/message-builder.service";
import { ResponseParserService } from "../../services/response-parser.service";


// Repositories
import { TypeORMDesignVersionRepository } from "../../repository/typeorm-design-version.repository";
import { TypeORMUserRepository } from "../../repository/typeorm-user.repository";
import { TypeORMClientErrorRepository } from "../../repository/typeorm-client-error.repository";

// Use Cases - Tasks
import { GetBoardListsUseCase } from "../../../application/use-cases/get-board-lists-in-trello.use-case";
import { ExtractTasksUseCase } from "../../../application/use-cases/extract-tasks.use-case";
import { AddTasksToTrelloUseCase } from "../../../application/use-cases/add-tasks-to-trello.use-case";

// Use Cases - Design
import { GenerateDesignUseCase } from "../../../application/use-cases/generate-design.use-case";
import { GenerateDesignFromConversationUseCase } from "../../../application/use-cases/generate-design-from-conversation.use-case";
import { EditDesignWithAIUseCase } from "../../../application/use-cases/edit-design-with-ai.use-case";

// Use Cases - Design Versions
import { SaveDesignVersionUseCase } from "../../../application/use-cases/save-design-version.use-case";
import { GetAllDesignVersionsUseCase } from "../../../application/use-cases/get-all-design-versions.use-case";
import { GetDesignVersionByIdUseCase } from "../../../application/use-cases/get-design-version-by-id.use-case";
import { DeleteDesignVersionUseCase } from "../../../application/use-cases/delete-design-version.use-case";

// Use Cases - Client Errors
import { ReportClientErrorUseCase } from "../../../application/use-cases/report-client-error.use-case";

// Controllers
import { TaskController } from "../controllers/task.controller";
import { TrelloController } from "../controllers/trello.controller";
import { DesignController } from "../controllers/design.controller";
import { DesignVersionController } from "../controllers/design-version.controller";
import { AIModelsController } from "../controllers/ai-models.controller";
import { DesignSystemsController } from "../controllers/design-systems.controller";
import { ClientErrorController } from "../controllers/client-error.controller";

import { UserMiddleware } from "../middleware/user.middleware";
import { GenerateDesignBasedOnExistingUseCase } from "../../../application/use-cases/generate-design-based-on-existing.use-case";
import { GeneratePrototypeConnectionsUseCase } from "../../../application/use-cases/generate-prototype-connections.use-case";
import { PrototypeService } from "../../services/prototype.service";



export const setupDependencies = () => {

    // Repositories
    const jsonToToonService = new JsonToToonService();
    const userRepository = new TypeORMUserRepository();
    const designVersionRepository = new TypeORMDesignVersionRepository();
    const clientErrorRepository = new TypeORMClientErrorRepository();


    // Services
    const trelloService = new TrelloService();
    const promptBuilderService = new PromptBuilderService();
    const aiCostCalculatorService = new AiCostCalculatorService()
    const iconService = new IconService();
    const clientFactory = new OpenAIClientFactory();
    const toolCallHandler = new ToolCallHandlerService(iconService);
    const timer = new Timer('AI Design Generation');
    const responseParser = new ResponseParserService();
    const messageBuilder = new MessageBuilderService(promptBuilderService);
    const prototypeService = new PrototypeService(
        clientFactory,
        aiCostCalculatorService,
    );
    const aiExtractTasksService = new AiExtractTasksService(aiCostCalculatorService);
    const defaultAiDesignService = new AiGenerateDesignService(
        promptBuilderService,
        aiCostCalculatorService,
        iconService,
        clientFactory,
        toolCallHandler,
        responseParser,
        messageBuilder,
        timer,
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
        prototypeService
    );



    const saveDesignVersionUseCase = new SaveDesignVersionUseCase(designVersionRepository);
    const getAllDesignVersionsUseCase = new GetAllDesignVersionsUseCase(designVersionRepository);
    const getDesignVersionByIdUseCase = new GetDesignVersionByIdUseCase(designVersionRepository);
    const deleteDesignVersionUseCase = new DeleteDesignVersionUseCase(designVersionRepository);

    // Use Cases - Client Errors
    const reportClientErrorUseCase = new ReportClientErrorUseCase(clientErrorRepository);

    // Controllers
    const trelloController = new TrelloController(getBoardListsUseCase);
    const taskController = new TaskController(extractTasksUseCase, addTasksToTrelloUseCase, generateDesignUseCase);

    const userMiddleware = new UserMiddleware(userRepository);

    const designController = new DesignController(
        generateDesignFromConversationUseCase,
        editDesignWithAIUseCase,
        generateDesignBasedOnExistingUseCase,
        generatePrototypeConnectionsUseCase
    );

    const designVersionController = new DesignVersionController(
        saveDesignVersionUseCase,
        getAllDesignVersionsUseCase,
        getDesignVersionByIdUseCase,
        deleteDesignVersionUseCase
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
        designVersionController,
        aiModelsController,
        designSystemsController,
        clientErrorController,
        userMiddleware
    };
};