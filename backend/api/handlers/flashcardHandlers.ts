import { join } from "path";
import { JSONFile } from "lowdb/node";
import { Low } from "lowdb";
import {
	Flashcard,
	NewFlashcard,
	PatchFlashcard,
} from "../../../share/types";
import * as tools from "../tools";
import { Database } from "../types";

const projectBasePath = process.cwd();
const dbPathAndFileName = join(projectBasePath, "backend/data/db.json");
const adapter = new JSONFile<Database>(dbPathAndFileName);
const db: Low<Database> = new Low<Database>(adapter, {} as Database);
await db.read();

export const getAllFlashcards = () => {
	return db.data.flashcards;
};

export const getOneFlashcard = (suuid: string) => {
	const flashcard = db.data.flashcards.find((m) => m.suuid === suuid);
	if (flashcard) {
		return flashcard;
	} else {
		return null;
	}
};

export const createFlashcard = async (newFlashcard: NewFlashcard) => {
	const flashcard: Flashcard = {
		...newFlashcard,
		suuid: tools.generateSuuid(),
	};
	const flashcards = db.data.flashcards;
	flashcards.push(flashcard);
	await db.write();
	return flashcard;
};

export const replaceFlashcard = async (
	suuid: string,
	newFlashcard: NewFlashcard
) => {
	const flashcard: Flashcard | undefined = db.data.flashcards.find(
		(m) => m.suuid === suuid
	);
	if (flashcard) {
		flashcard.category = newFlashcard.category;
		flashcard.front = newFlashcard.front;
		flashcard.back = newFlashcard.back;
		await db.write();
		return flashcard;
	} else {
		return null;
	}
};

export const replaceSomeFieldsInFlashcard = async (
	suuid: string,
	patchFlashcard: PatchFlashcard
) => {
	const flashcard: Flashcard | undefined = db.data.flashcards.find(
		(m) => m.suuid === suuid
	);
	if (flashcard) {
		if (patchFlashcard.category)
			flashcard.category = patchFlashcard.category;
		if (patchFlashcard.front) flashcard.front = patchFlashcard.front;
		if (patchFlashcard.back) flashcard.back = patchFlashcard.back;
		await db.write();
		return flashcard;
	} else {
		return null;
	}
};

export const deleteFlashcard = async (suuid: string) => {
	const deletedFlashcard = db.data.flashcards.find((m) => m.suuid === suuid);
	if (deletedFlashcard) {
		const indexToRemove = db.data.flashcards.findIndex(
			(flashcard) => flashcard.suuid === suuid
		);
		if (indexToRemove !== -1) {
			db.data.flashcards.splice(indexToRemove, 1);
			await db.write();
		}
		return deletedFlashcard;
	} else {
		return null;
	}
};
