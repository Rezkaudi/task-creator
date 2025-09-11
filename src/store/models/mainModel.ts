import { action, Action, thunk, Thunk } from "easy-peasy";
import { StoreModel } from "../store";

export interface MainModel {
	// state
	message: string;

	// actions
	setMessage: Action<this, string>;

	// thunks
	initialize: Thunk<this, void, void, StoreModel>;
}

export const mainModel: MainModel = {
	// state
	message: "",

	// actions
	setMessage: action((state, message) => {
		state.message = message;
	}),

	// thunks
	initialize: thunk((actions, _, helpers) => {
		actions.setMessage("Welcome to this site.");
		helpers.getStoreActions().flashcardModel.loadFlashcardsThunk();
	}),
};
