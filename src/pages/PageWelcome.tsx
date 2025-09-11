import { FlashcardArea } from "../components/FlashcardArea";
import { useTypedStoreState } from "../store/hooks";

export const PageWelcome = () => {
	const { message } = useTypedStoreState((state) => state.mainModel);

	return (
		<>
			<p className="mb-3">{message}</p>
			<FlashcardArea />
		</>
	);
};
