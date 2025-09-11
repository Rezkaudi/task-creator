import axios from "axios";
import { FlashcardSchema, FrontendFlashcard } from "../../share/types";
import { DataModelResponse } from "./types";
import * as config from '../../share/config';

export const getFlashcards = async () => {
	return new Promise<FrontendFlashcard[]>((resolve, reject) => {
		(async () => {
			try {
				const response = await axios.get(
					`http://localhost:${config.getBackendPort()}/api/flashcards`
				);
				if (response.status === 200) {
					const _fetchedFlashcards: unknown[] = response.data;
					const _frontendFlashcards: FrontendFlashcard[] = [];
					for (const _fetchedFlashcard of _fetchedFlashcards) {
						const parseResult =
							FlashcardSchema.safeParse(_fetchedFlashcard);
						if (parseResult.success) {
							const { suuid, category, front, back } =
								parseResult.data;
							const _frontendFlashcard: FrontendFlashcard = {
								suuid: suuid.trim(),
								category: category.trim(),
								front: front.trim(),
								back: back.trim(),
								isOpen: false,
							};
							_frontendFlashcards.push(_frontendFlashcard);
						} else {
							let r = "";
							r += `INVALID FLASHCARD IN IMPORT: ${JSON.stringify(
								_fetchedFlashcard,
								null,
								2
							)}\n`;
							parseResult.error.errors.forEach((err) => {
								r += `Error in field "${err.path.join(
									"."
								)}" - ${err.message}\n`;
							});
							console.error(r);
						}
					}
					resolve(_frontendFlashcards);
				}
			} catch (e: unknown) {
				reject(new Error(`ERROR: ${(e as Error).message}`));
			}
		})();
	});
};

export const deleteFlashcard = async (suuid: string) => {
	return new Promise<DataModelResponse>((resolve, reject) => {
		(async () => {
			try {
				const response = await axios.delete(
					`http://localhost:${config.getBackendPort()}/api/flashcards/${suuid}`
				);
				if (response.status === 200) {
					resolve({
						message: `flashcard ${suuid} deleted successfully`,
						success: true,
					});
				} else {
					resolve({
						message: `failed to delete flashcard ${suuid}`,
						success: false,
					});
				}
			} catch (e: unknown) {
				reject(new Error(`ERROR: ${(e as Error).message}`));
			}
		})();
	});
};
