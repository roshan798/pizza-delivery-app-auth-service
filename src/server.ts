import app from './app';
import { Config } from './confiig';
import logger from './confiig/logger';

const startServer = () => {
	const url = Config.URL;
	const port = Config.PORT;
	try {
		app.listen(port, () => {
			logger.info(`Server is running on ${url}`);
		});
	} catch (error) {
		logger.error('Error starting the server:', error);
		process.exit(1);
	}
};

startServer();
