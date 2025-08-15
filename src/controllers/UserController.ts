import { NextFunction, Response, Request } from 'express';
import { UserService } from '../services/UserService';
import logger from '../config/logger';
import { validationResult } from 'express-validator';
import { Roles } from '../constants';
import { UserCreateRequest, UserUpdateRequest } from '../types';

export class UserController {
	constructor(private readonly userService: UserService) {}

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
				users: users,
			});
		} catch (err) {
			logger.error(err);
			next(err);
		}
	}

	async getUserById(req: Request, res: Response, next: NextFunction) {
		try {
			const id = req.params.id;
			logger.info(`[GET] Request received with id: ${id}`);
			const validationErrors = validationResult(req);
			if (!validationErrors.isEmpty()) {
				logger.warn('[GET] Param validation failed');
				return res.status(400).json({
					success: false,
					message: 'Invalid input data',
					errors: validationErrors.array(),
				});
			}
			const user = await this.userService.findById(Number(id));
			logger.info(`[GET] User retrieved successfully`);
			return res.status(200).json({
				success: true,
				user: { ...user, password: undefined },
			});
		} catch (err) {
			logger.error(err);
			next(err);
		}
	}

	async updateUserById(
		req: UserUpdateRequest,
		res: Response,
		next: NextFunction
	) {
		try {
			const id = req.params.id;
			logger.info(`[PUT] Request received to update user with id: ${id}`);
			const validationErrors = validationResult(req);
			if (!validationErrors.isEmpty()) {
				logger.warn('[PUT] Param validation failed');
				return res.status(400).json({
					success: false,
					message: 'Invalid input data',
					errors: validationErrors.array(),
				});
			}
			const { firstName, lastName, email } = req.body;
			logger.debug(
				`Update payload: ${JSON.stringify({ firstName, lastName, email })}`
			);
			if (!firstName && !lastName && !email) {
				return res.status(400).json({
					success: false,
					message: 'At least one of the fields must be provided!',
				});
			}

			const existingUser = await this.userService.findById(Number(id));
			if (!existingUser) {
				logger.warn(`User with id ${id} not found`);
				return res.status(404).json({
					success: false,
					message: 'User not found',
				});
			}

			const updatedUserData = {
				...existingUser,
				firstName: firstName || existingUser.firstName,
				lastName: lastName || existingUser.lastName,
				email: email || existingUser.email,
			};
			logger.info(`Updating user with id ${id}`);
			const savedUser = await this.userService.updateUserByUserId(
				updatedUserData,
				Number(id)
			);

			logger.info(`User with id ${id} successfully updated`);

			return res.status(200).json({
				success: true,
				user: {
					...savedUser,
					password: undefined,
				},
			});
		} catch (err) {
			logger.error(`Error updating user with id ${req.params.id}:`, err);
			next(err);
		}
	}

	async deleteUserById(
		req: UserUpdateRequest,
		res: Response,
		next: NextFunction
	) {
		try {
			const id = req.params.id;
			logger.info(
				`[DELETE] Request received to delete user with id: ${id}`
			);
			const validationErrors = validationResult(req);
			if (!validationErrors.isEmpty()) {
				logger.warn('[PUT] Param validation failed');
				return res.status(400).json({
					success: false,
					message: 'Invalid input data',
					errors: validationErrors.array(),
				});
			}

			const existingUser = await this.userService.findById(Number(id));
			if (!existingUser) {
				logger.warn(`User with id ${id} not found`);
				return res.status(404).json({
					success: false,
					message: 'User not found',
				});
			}

			logger.info(`Deleting user with id ${id}`);
			await this.userService.deleteUserByUserId(Number(id));
			logger.info(`User with id ${id} successfully deleted`);

			return res.status(200).json({
				success: true,
			});
		} catch (err) {
			logger.error(`Error deleting user with id ${req.params.id}:`, err);
			next(err);
		}
	}
}
