import 'reflect-metadata';
import express, { NextFunction, Request, Response } from 'express';
import logger from './confiig/logger';
import { HttpError } from 'http-errors';
import authRouter from './routes/auth';
const app = express();

app.get('/', (req, res) => {
	res.json({ message: 'Welcome to Auth-Service 👋' });
});
app.use(express.json());
app.use('/auth', authRouter);

// globlal error handler

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
	logger.info('Global error handler triggered');
	logger.error('Error details:', { error: err.message });
	const status = err.status || 500;
	const message = err.message || 'Internal Server Error';
	res.status(status).json({
		errors: [
			{
				type: err.name || 'UnknownError',
				message: message,
				stack: '', // Config.NODE_ENV === 'development' ? err.stack : undefined,
				path: req.originalUrl,
			},
		],
	});
});
export default app;
