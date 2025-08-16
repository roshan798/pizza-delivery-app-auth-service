import app from './app';
import { Config } from './config';
import { AppDataSource } from './config/data-source';
import logger from './config/logger';
import { createAdminUser } from './utils';

const startServer = async () => {
	const url = Config.URL;
	const port = Config.PORT;
	try {
		await AppDataSource.initialize();
		logger.info('Database connected succesfully');
		await createAdminUser();
		app.listen(port, () => {
			logger.info(`Server is running on ${url}`);
		});
	} catch (error) {
		logger.error('Error starting the server:', error);
		process.exit(1);
	}
};
void startServer();
