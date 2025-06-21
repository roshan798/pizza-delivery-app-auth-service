import { NextFunction, Response } from 'express';
import logger from '../confiig/logger';
import { RegisterUserRequest } from '../types';
import { UserService } from '../services/UserService';
import createHttpError from 'http-errors';

export class AuthController {
	constructor(private userService: UserService) {}
	async register(
		req: RegisterUserRequest,
		res: Response,
		next: NextFunction
	) {
		logger.info('Register endpoint hit');
		logger.info(`Request body: ${JSON.stringify(req.body)}`);
		try {
			const { firstName, lastName, email, password } = req.body;
			if (!email) {
				const err = createHttpError(400, 'Email is required!');
				throw err;
			}

			const savedUser = await this.userService.create({
				firstName,
				lastName,
				email,
				password,
			});
			const responseData = {
				userId: savedUser.id,
				firstName: savedUser.firstName,
				lastName: savedUser.lastName,
				email: savedUser.email,
			};
			logger.info(
				`User registered successfully: ${JSON.stringify(responseData)}`
			);
			res.status(201).json({
				message: 'User registered successfully',
				...responseData,
			});
		} catch (err) {
			next(err);
		}
	}
}
