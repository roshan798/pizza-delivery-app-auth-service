import { Request, Response } from 'express';
import logger from '../confiig/logger';
import { AppDataSource } from '../confiig/data-source';
import { User } from '../entity/User';

interface UserData {
	firstName: string;
	lastName: string;
	email: string;
	password: string; // In a real application, ensure to hash the password before saving
}
interface RegisterUserRequest extends Request {
	body: UserData;
}
export class AuthController {
	async register(req: RegisterUserRequest, res: Response) {
		logger.info('Register endpoint hit');
		logger.info(`Request body: ${JSON.stringify(req.body)}`);
		const { firstName, lastName, email, password } = req.body;
		logger.info(
			`Received registration data: ${JSON.stringify({ firstName, lastName, email })}`
		);

		const userRepo = AppDataSource.getRepository(User);
		await userRepo.save({
			firstName,
			lastName,
			email,
			password, // In a real application, ensure to hash the password before saving
		});
		res.status(201).json({
			message: 'User registered successfully',
		});
	}
}
