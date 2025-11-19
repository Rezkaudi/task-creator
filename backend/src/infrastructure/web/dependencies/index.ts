// Services
import { TrelloService } from "../../services/trello.service";
import { GPTService } from "../../services/gpt.service";
import { GPTDesignService } from "../../services/gpt-design.service";

// Use Cases
import { GetBoardListsUseCase } from "../../../application/use-cases/get-board-lists-in-trello.use-case";
import { ExtractTasksUseCase } from "../../../application/use-cases/extract-tasks.use-case";
import { AddTasksToTrelloUseCase } from "../../../application/use-cases/add-tasks-to-trello.use-case";
import { GenerateDesignUseCase } from "../../../application/use-cases/generate-design.use-case";

// Controllers
// import { TaskController } from "../controllers/task.controller";
import { TaskController } from "../controllers/task.controller.enhanced";
import { TrelloController } from "../controllers/trello.controller";

export const setupDependencies = () => {

    // Services
    const trelloService = new TrelloService();
    const gptService = new GPTService();
    const gptDesignService = new GPTDesignService();

    // Use Cases
    const getBoardListsUseCase = new GetBoardListsUseCase(trelloService);
    const extractTasksUseCase = new ExtractTasksUseCase(gptService);
    const addTasksToTrelloUseCase = new AddTasksToTrelloUseCase(trelloService);
    const generateDesignUseCase = new GenerateDesignUseCase(gptDesignService);

    // Controllers
    // const taskController = new TaskController(extractTasksUseCase, addTasksToTrelloUseCase);
    const taskController = new TaskController(extractTasksUseCase, addTasksToTrelloUseCase, generateDesignUseCase);

    const trelloController = new TrelloController(getBoardListsUseCase);

    return {
        taskController,
        trelloController,
    };
};