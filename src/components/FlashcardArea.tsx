import { useTypedStoreActions, useTypedStoreState } from "../store/hooks";

export const FlashcardArea = () => {
	const { frontendFlashcards } = useTypedStoreState(
		(state) => state.flashcardModel
	);
	const { toggleFrontendFlashcardThunk, deleteFlashcardFromDatasourceThunk } =
		useTypedStoreActions((actions) => actions.flashcardModel);

	return (
		<div>
			<h2 className="text-xl mb-3">
				There are {frontendFlashcards.length} flashcards:{" "}
			</h2>
			{frontendFlashcards.map((ff) => {
				return (
					<div className="mb-4 w-full md:w-[35rem]" key={ff.suuid}>
						<div
							className="bg-slate-600 text-slate-200 p-2 rounded-t cursor-pointer"
							onClick={() => toggleFrontendFlashcardThunk(ff)}
						>
							{ff.front}
						</div>
						{ff.isOpen && (
							<div className="bg-slate-300 p-2 rounded-b flex justify-between items-center">
								<p className="font-mono text-orange-800 text-sm">
									{ff.back}
								</p>
								<button
									className="btn-small"
									onClick={() =>
										deleteFlashcardFromDatasourceThunk(ff)
									}
								>
									Delete
								</button>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};
