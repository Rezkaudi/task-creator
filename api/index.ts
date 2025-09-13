import * as config from "../share/config";
import app from "./server";

app.listen(config.getBackendPort(), () => {
	console.log(
		`API is running at http://localhost:${config.getBackendPort()}`
	);
});

export default app;