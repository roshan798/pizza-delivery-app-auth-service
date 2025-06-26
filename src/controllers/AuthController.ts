import { NextFunction, Response } from 'express';
import logger from '../confiig/logger';
import { RegisterUserRequest } from '../types';
import { UserService } from '../services/UserService';
import { validationResult } from 'express-validator';
import { Payload, TokenService } from '../services/TokenService';
import { AppDataSource } from '../confiig/data-source';
import { RefreshToken } from '../entity/RefreshToken';

export class AuthController {
	constructor(
		private userService: UserService,
		private tokenService: TokenService
	) {}
	async register(
		req: RegisterUserRequest,
		res: Response,
		next: NextFunction
	) {
		logger.info('Register endpoint hit');
		// Validate request body
		const validationErrors = validationResult(req);
		if (!validationErrors.isEmpty()) {
			logger.error(
				`Validation errors: ${JSON.stringify(validationErrors.array())}`
			);
			return res.status(400).json({
				message: 'Validation failed',
				errors: validationErrors.array(),
			});
		}
		try {
			const { firstName, lastName, email, password } = req.body;
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

			const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
			const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365; // TODO : 366 if leap year
			const newRefreshToken = await refreshTokenRepo.save({
				user: savedUser,
				expiresAt: new Date(Date() + MS_IN_YEAR),
			});

			const payload: Payload = {
				userId: savedUser.id.toString(),
				role: savedUser.role,
			};
			const accessToken = this.tokenService.generateAccessToken(payload);
			const refreshToken = this.tokenService.generateRefreshToken(
				payload,
				newRefreshToken.user.id
			);

			res.cookie('accessToken', accessToken, {
				httpOnly: true,
				maxAge: 60 * 60 * 1000, // 60 minutes
				domain: 'localhost',
				sameSite: 'strict',
			});
			res.cookie('refreshToken', refreshToken, {
				httpOnly: true,
				maxAge: 30 * 24 * 60 * 60 * 1000,
				domain: 'localhost',
				sameSite: 'strict',
			});

			res.status(201).json({
				message: 'User registered successfully',
				...responseData,
			});
		} catch (err) {
			next(err);
		}
	}
}
