import app from './app';
import { Config } from './confiig';
import { AppDataSource } from './confiig/data-source';
import logger from './confiig/logger';

const startServer = async () => {
	const url = Config.URL;
	const port = Config.PORT;
	try {
		await AppDataSource.initialize();
		logger.info('Database connected succesfully');
		app.listen(port, () => {
			logger.info(`Server is running on ${url}`);
		});
	} catch (error) {
		logger.error('Error starting the server:', error);
		process.exit(1);
	}
};
void startServer();
