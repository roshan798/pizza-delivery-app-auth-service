import app from './app';
import { Config } from './confiig';

const startServer = () => {
	const url = Config.URL;
	const port = Config.PORT;
	try {
		app.listen(port, () => {
			// eslint-disable-next-line no-console
			console.log(`Server is running at ${url}`);
		});
	} catch (error) {
		// eslint-disable-next-line no-console
		console.error('Error starting the server:', error);
		process.exit(1);
	}
};

startServer();
