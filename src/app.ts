import 'reflect-metadata';
import path from 'node:path';
import express, { NextFunction, Request, Response } from 'express';
import logger from './config/logger';
import { HttpError } from 'http-errors';
import authRouter from './routes/auth';
import tenantRouter from './routes/tenant';
import userRouter from './routes/users';
import cookieParser from 'cookie-parser';
const app = express();

app.get('/', (req, res) => {
	res.json({ message: 'Welcome to Auth-Service 👋' });
});
app.use(express.json());
app.use(
	express.static(path.join(__dirname, '../public'), {
		dotfiles: 'allow', // Allow serving dotfiles like .well-known/jwks.json
		extensions: ['json'], // Serve .json files without needing to specify the extension
	})
);
app.use(cookieParser());
app.use('/auth', authRouter);
app.use('/tenants', tenantRouter);
app.use('/users', userRouter);

// globlal error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
	logger.info('Global error handler triggered');
	logger.error('Error details:', { error: err.message });
	const status = err.status || err.statusCode || 500;
	const message = err.message || 'Internal Server Error';
	logger.error(`Error occurred: ${message} (Status: ${status})`);
	res.status(status).json({
		errors: [
			{
				type: err.name || 'UnknownError',
				message: message,
				stack: '',
				path: req.originalUrl,
			},
		],
	});
});
export default app;
