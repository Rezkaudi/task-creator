import { Task } from "../../domain/entities/task.entity";
import { ITaskManagment } from "../../domain/services/ITaskManagment";


export class GetBoardListsUseCase {

    constructor(
        private readonly taskManagment: ITaskManagment,
    ) { }

    execute = async (): Promise<any> => {
        const boardLists = await this.taskManagment.getListsBoards();
        return boardLists;
    }
}
