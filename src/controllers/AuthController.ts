import { Response } from 'express';
import logger from '../confiig/logger';
import { RegisterUserRequest } from '../types';
import { UserService } from '../services/UserService';

export class AuthController {
	constructor(private userService: UserService) {}
	async register(req: RegisterUserRequest, res: Response) {
		logger.info('Register endpoint hit');
		logger.info(`Request body: ${JSON.stringify(req.body)}`);
		const { firstName, lastName, email, password } = req.body;
		await this.userService.create({
			firstName,
			lastName,
			email,
			password,
		});

		logger.info(
			`Received registration data: ${JSON.stringify({ firstName, lastName, email })}`
		);

		res.status(201).json({
			message: 'User registered successfully',
		});
	}
}
