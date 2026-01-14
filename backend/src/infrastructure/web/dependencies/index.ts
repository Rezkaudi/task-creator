// src/infrastructure/web/dependencies/index.ts

// Services
import { TrelloService } from "../../services/trello.service";
import { AiExtractTasksService } from "../../services/ai-extract-tasks.service";
import { AiGenerateDesignService } from "../../services/ai-generate-design.service";
import { PromptBuilderService } from "../../services/prompt-builder.service";
import { AiCostCalculatorService } from "../../services/ai-cost.calculator.service";

// Repositories
import { TypeORMDesignVersionRepository } from "../../repository/typeorm-design-version.repository";
import { TypeORMUserRepository } from "../../repository/typeorm-user.repository";

// Use Cases - Tasks
import { GetBoardListsUseCase } from "../../../application/use-cases/get-board-lists-in-trello.use-case";
import { ExtractTasksUseCase } from "../../../application/use-cases/extract-tasks.use-case";
import { AddTasksToTrelloUseCase } from "../../../application/use-cases/add-tasks-to-trello.use-case";

// Use Cases - Design
import { GenerateDesignUseCase } from "../../../application/use-cases/generate-design.use-case";
import { GenerateDesignFromTextUseCase } from "../../../application/use-cases/generate-design-from-text.use-case";
import { GenerateDesignFromConversationUseCase } from "../../../application/use-cases/generate-design-from-conversation.use-case";
import { EditDesignWithAIUseCase } from "../../../application/use-cases/edit-design-with-ai.use-case";

// Use Cases - Design Versions
import { SaveDesignVersionUseCase } from "../../../application/use-cases/save-design-version.use-case";
import { GetAllDesignVersionsUseCase } from "../../../application/use-cases/get-all-design-versions.use-case";
import { GetDesignVersionByIdUseCase } from "../../../application/use-cases/get-design-version-by-id.use-case";
import { DeleteDesignVersionUseCase } from "../../../application/use-cases/delete-design-version.use-case";

// Controllers
import { TaskController } from "../controllers/task.controller";
import { TrelloController } from "../controllers/trello.controller";
import { DesignController } from "../controllers/design.controller";
import { DesignVersionController } from "../controllers/design-version.controller";
import { AIModelsController } from "../controllers/ai-models.controller"; // ← NEW
import { DesignSystemsController } from "../controllers/design-systems.controller";

import { UserMiddleware } from "../middleware/user.middleware";


export const setupDependencies = () => {

    // Repositories
    const userRepository = new TypeORMUserRepository();
    const designVersionRepository = new TypeORMDesignVersionRepository();

    // Services
    const trelloService = new TrelloService();
    const promptBuilderService = new PromptBuilderService();
    const aiCostCalculatorService = new AiCostCalculatorService()
    const aiExtractTasksService = new AiExtractTasksService(aiCostCalculatorService);
    const defaultAiDesignService = new AiGenerateDesignService(promptBuilderService, aiCostCalculatorService);

    // Use Cases - Tasks
    const getBoardListsUseCase = new GetBoardListsUseCase(trelloService);
    const extractTasksUseCase = new ExtractTasksUseCase(aiExtractTasksService);
    const addTasksToTrelloUseCase = new AddTasksToTrelloUseCase(trelloService);
    const generateDesignUseCase = new GenerateDesignUseCase(aiExtractTasksService);

    const generateDesignFromTextUseCase = new GenerateDesignFromTextUseCase(defaultAiDesignService);
    const generateDesignFromConversationUseCase = new GenerateDesignFromConversationUseCase(defaultAiDesignService);
    const editDesignWithAIUseCase = new EditDesignWithAIUseCase(defaultAiDesignService);

    const saveDesignVersionUseCase = new SaveDesignVersionUseCase(designVersionRepository);
    const getAllDesignVersionsUseCase = new GetAllDesignVersionsUseCase(designVersionRepository);
    const getDesignVersionByIdUseCase = new GetDesignVersionByIdUseCase(designVersionRepository);
    const deleteDesignVersionUseCase = new DeleteDesignVersionUseCase(designVersionRepository);

    // Controllers
    const trelloController = new TrelloController(getBoardListsUseCase);
    const taskController = new TaskController(extractTasksUseCase, addTasksToTrelloUseCase, generateDesignUseCase);

    const userMiddleware = new UserMiddleware(userRepository);

    const designController = new DesignController(
        generateDesignFromTextUseCase,
        generateDesignFromConversationUseCase,
        editDesignWithAIUseCase
    );

    const designVersionController = new DesignVersionController(
        saveDesignVersionUseCase,
        getAllDesignVersionsUseCase,
        getDesignVersionByIdUseCase,
        deleteDesignVersionUseCase
    );

    // ✨ NEW: AI Models Controller
    const aiModelsController = new AIModelsController();
    const designSystemsController = new DesignSystemsController();



    return {
        taskController,
        trelloController,
        designController,
        designVersionController,
        aiModelsController,
        designSystemsController,
        userMiddleware
    };
};