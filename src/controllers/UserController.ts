import { NextFunction, Response, Request } from 'express';
import { UserService } from '../services/UserService';
import logger from '../config/logger';
import { validationResult } from 'express-validator';
import { Roles } from '../constants';
import { UserCreateRequest } from '../types';

export class UserController {
	constructor(private userService: UserService) {}

	async createUser(
		req: UserCreateRequest,
		res: Response,
		next: NextFunction
	) {
		logger.info('[CREATE] Request received');

		const validationErrors = validationResult(req);
		if (!validationErrors.isEmpty()) {
			logger.warn('[CREATE] Input validation failed');
			return res.status(400).json({
				success: false,
				message: 'Invalid input data',
				errors: validationErrors.array(),
			});
		}

		try {
			const { firstName, lastName, email, password, tenantId } = req.body;
			const savedUser = await this.userService.createUserByAdmin({
				firstName,
				lastName,
				email,
				password,
				tenantId,
				role: Roles.MANAGER,
			});
			logger.info(`[CREATE] User created with ID: ${savedUser.id}`);
			return res.status(201).json({
				success: true,
				message: 'User created successfully',
				id: savedUser.id,
			});
		} catch (error) {
			next(error);
		}
	}

	async getUsers(req: Request, res: Response, next: NextFunction) {
		logger.info('[GET] Request received');
		try {
			const users = await this.userService.getAllUsers();
			logger.info(`[GET] Users retrieved successfully`);
			return res.status(200).json({
				success: true,
				// message: 'Users retrieved successfully',
				users: users,
			});
		} catch (err) {
			logger.error(err);
			next(err);
		}
	}
}
