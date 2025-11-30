// Services
import { TrelloService } from "../../services/trello.service";
import { GPTService } from "../../services/gpt.service";
import { GPTDesignService } from "../../services/gpt-design.service";
import { ClaudeService } from "../../services/claude.service";

// Repositories
import { TypeORMDesignVersionRepository } from "../../repository/typeorm-design-version.repository";

// Use Cases - Tasks
import { GetBoardListsUseCase } from "../../../application/use-cases/get-board-lists-in-trello.use-case";
import { ExtractTasksUseCase } from "../../../application/use-cases/extract-tasks.use-case";
import { AddTasksToTrelloUseCase } from "../../../application/use-cases/add-tasks-to-trello.use-case";
import { GenerateDesignUseCase } from "../../../application/use-cases/generate-design.use-case";
import { GenerateDesignFromClaudeUseCase } from "../../../application/use-cases/generate-design-from-claude.use-case";

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

export const setupDependencies = () => {
    // Services
    const trelloService = new TrelloService();
    const gptService = new GPTService();
    const gptDesignService = new GPTDesignService();
    const claudeService = new ClaudeService();

    // Repositories
    const designVersionRepository = new TypeORMDesignVersionRepository();

    // Use Cases - Tasks
    const getBoardListsUseCase = new GetBoardListsUseCase(trelloService);
    const extractTasksUseCase = new ExtractTasksUseCase(gptService);
    const addTasksToTrelloUseCase = new AddTasksToTrelloUseCase(trelloService);
    const generateDesignUseCase = new GenerateDesignUseCase(gptDesignService);
    const generateDesignFromClaudeUseCase = new GenerateDesignFromClaudeUseCase(claudeService);

    // Use Cases - Design Versions
    const saveDesignVersionUseCase = new SaveDesignVersionUseCase(designVersionRepository);
    const getAllDesignVersionsUseCase = new GetAllDesignVersionsUseCase(designVersionRepository);
    const getDesignVersionByIdUseCase = new GetDesignVersionByIdUseCase(designVersionRepository);
    const deleteDesignVersionUseCase = new DeleteDesignVersionUseCase(designVersionRepository);

    // Controllers
    const taskController = new TaskController(extractTasksUseCase, addTasksToTrelloUseCase, generateDesignUseCase);
    const trelloController = new TrelloController(getBoardListsUseCase);
    const designController = new DesignController(generateDesignFromClaudeUseCase);
    const designVersionController = new DesignVersionController(
        saveDesignVersionUseCase,
        getAllDesignVersionsUseCase,
        getDesignVersionByIdUseCase,
        deleteDesignVersionUseCase
    );

    return {
        taskController,
        trelloController,
        designController,
        designVersionController,
    };
};
