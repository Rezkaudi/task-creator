//src/infrastructure/web/dependencies/index.ts
// Srevices
import { TrelloService } from "../../services/trello.service";
import { GPTService } from "../../services/gpt.service";

// Use Cases
import { GetBoardListsUseCase } from "../../../application/use-cases/get-board-lists-in-trello.use-case";
import { ExtractTasksUseCase } from "../../../application/use-cases/extract-tasks.use-case";
import { AddTasksToTrelloUseCase } from "../../../application/use-cases/add-tasks-to-trello.use-case";

// Controllers
import { TaskController } from "../../web/controllers/task.controller";
import { TrelloController } from "../../web/controllers/trello.controller";
import { DesignExtractorService } from "../../services/DesignExtractorService";
import { ClaudeService } from "../../services/ClaudeService";
import { ExtractDesignSpecsUseCase } from "../../../application/use-cases/ExtractDesignSpecsUseCase";
import { GenerateDesignUseCase } from "../../../application/use-cases/GenerateDesignUseCase";
import { DesignController } from "../controllers/DesignController";

export const setupDependencies = () => {

    // Services
    const trelloService = new TrelloService();
    const gptService = new GPTService();

    // Use Cases
    const getBoardListsUseCase = new GetBoardListsUseCase(trelloService);
    const extractTasksUseCase = new ExtractTasksUseCase(gptService);
    const addTasksToTrelloUseCase = new AddTasksToTrelloUseCase(trelloService);

    // Controllers
    const taskController = new TaskController(extractTasksUseCase, addTasksToTrelloUseCase);
    const trelloController = new TrelloController(getBoardListsUseCase);


    const designExtractorService = new DesignExtractorService();
    const claudeService = new ClaudeService();
    const extractDesignSpecsUseCase = new ExtractDesignSpecsUseCase(designExtractorService);
    const generateDesignUseCase = new GenerateDesignUseCase(claudeService);
    const designController = new DesignController(extractDesignSpecsUseCase, generateDesignUseCase);

    return {
        taskController,
        trelloController,
        designController
    };
};