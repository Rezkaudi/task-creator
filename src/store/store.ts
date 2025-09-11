import { createStore } from "easy-peasy";
import { mainModel, MainModel } from "./models/mainModel";
import { flashcardModel, FlashcardModel } from "./models/flashcardModel";

export type StoreModel = {
	mainModel: MainModel;
	flashcardModel: FlashcardModel;
};

export const store = createStore<StoreModel>({
	mainModel,
	flashcardModel
});
