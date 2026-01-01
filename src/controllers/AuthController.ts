import { NextFunction, Response } from 'express';
import logger from '../config/logger';
import {
	AuthCookie,
	AuthRequest,
	LoginUserRequest,
	RegisterUserRequest,
} from '../types';
import { UserService } from '../services/UserService';
import { Payload, TokenService } from '../services/TokenService';
import { CredentialService } from '../services/CredentialService';
import { validationResult } from 'express-validator';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import { Config } from '../config';
import { Roles } from '../constants';

export class AuthController {
	constructor(
		private readonly userService: UserService,
		private readonly tokenService: TokenService,
		private readonly credentialService: CredentialService
	) {}

	async register(
		req: RegisterUserRequest,
		res: Response,
		next: NextFunction
	) {
		logger.info('[REGISTER] Request received');

		const validationErrors = validationResult(req);
		if (!validationErrors.isEmpty()) {
			logger.warn('[REGISTER] Input validation failed');
			return res.status(400).json({
				success: false,
				message: 'Invalid input data',
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
				role: Roles.CUSTOMER,
			});

			const payload: Payload = {
				userId: savedUser.id.toString(),
				role: savedUser.role,
				tenantId: savedUser.tenantId
					? savedUser.tenantId.toString()
					: undefined,
				firstName: savedUser.firstName,
				lastName: savedUser.lastName,
				email: savedUser.email,
			};

			this.tokenService.addAccessToken(res, payload);
			await this.tokenService.addRefreshToken(res, payload, savedUser);

			logger.info(`[REGISTER] User created with ID: ${savedUser.id}`);
			return res.status(201).json({
				success: true,
				message: 'Registration successful',
				id: savedUser.id,
			});
		} catch (error) {
			logger.error('[REGISTER] Internal server error');
			if (Config.NODE_ENV !== 'production') logger.debug(error);
			next(createHttpError(500, 'An error occurred during registration'));
		}
	}

	async login(req: LoginUserRequest, res: Response, next: NextFunction) {
		logger.info('[LOGIN] Request received');

		const validationErrors = validationResult(req);
		if (!validationErrors.isEmpty()) {
			logger.warn('[LOGIN] Input validation failed');
			return res.status(400).json({
				success: false,
				message: 'Invalid input data',
				errors: validationErrors.array(),
			});
		}

		try {
			const { email, password } = req.body;
			logger.debug('[LOGIN] Checking credentials');

			const savedUser = await this.userService.getUserByEmail(email);
			const isMatch = await this.credentialService.comparePassword(
				password,
				savedUser.password
			);

			if (!isMatch) {
				logger.warn('[LOGIN] Invalid email or password');
				throw createHttpError(401, 'Invalid credentials');
			}

			const payload: Payload = {
				userId: savedUser.id.toString(),
				role: savedUser.role,
				firstName: savedUser.firstName,
				lastName: savedUser.lastName,
				email: savedUser.email,
			};
			if (savedUser.role === Roles.MANAGER) {
				payload.tenantId = String(savedUser.tenantId!);
			}

			this.tokenService.addAccessToken(res, payload);
			await this.tokenService.addRefreshToken(res, payload, savedUser);

			logger.info(`[LOGIN] Authenticated user ID: ${savedUser.id}`);
			return res.status(200).json({
				success: true,
				message: 'Login successful',
				id: savedUser.id,
			});
		} catch (err) {
			next(err);
		}
	}

	async self(req: AuthRequest, res: Response, next: NextFunction) {
		logger.info('[SELF] Request received');
		try {
			const { sub: userId } = req.auth;
			const user = await this.userService.findById(Number(userId));
			logger.info(`[SELF] Retrieved data for user ID: ${userId}`);

			const userResponse = {
				...user,
				password: undefined,
			};
			if (user.tenantId !== null && user.tenantId !== undefined) {
				userResponse.tenantId = user.tenantId;
			} else {
				userResponse.tenantId = undefined;
			}

			res.json({
				success: true,
				user: userResponse,
			});
		} catch (error) {
			logger.error('[SELF] Failed to fetch user info');
			if (Config.NODE_ENV !== 'production') logger.debug(error);
			next(createHttpError(500, 'Could not retrieve user information'));
		}
	}

	async refresh(req: AuthRequest, res: Response, next: NextFunction) {
		logger.info('[REFRESH] Request received');
		try {
			const { sub: userId, jti: tokenId } = req.auth;
			logger.debug(`[REFRESH] Verifying token for user ID: ${userId}`);

			const user = await this.userService.findById(Number(userId));
			const payload: Payload = {
				userId: user.id.toString(),
				role: user.role,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
			};

			if (user.role === Roles.MANAGER) {
				payload.tenantId = String(user.tenantId!);
			}

			this.tokenService.addAccessToken(res, payload);
			await this.tokenService.addRefreshToken(
				res,
				payload,
				user,
				tokenId
			);

			logger.info(`[REFRESH] Tokens refreshed for user ID: ${userId}`);
			return res.status(200).json({
				success: true,
				message: 'Tokens refreshed successfully',
			});
		} catch (error) {
			logger.error('[REFRESH] Failed to refresh tokens');
			if (Config.NODE_ENV !== 'production') logger.debug(error);
			next(createHttpError(500, 'Token refresh failed'));
		}
	}

	async logout(req: AuthRequest, res: Response, next: NextFunction) {
		logger.info('[LOGOUT] Request received');
		try {
			const { refreshToken } = req.cookies as AuthCookie;

			if (!refreshToken) {
				logger.warn('[LOGOUT] No refresh token present');
				throw createHttpError(401, 'Invalid session');
			}

			let decoded;
			try {
				decoded = jwt.verify(refreshToken, Config.JWT_SECRET!) as {
					jti: string;
				};
			} catch {
				logger.warn('[LOGOUT] Refresh token verification failed');
				throw createHttpError(401, 'Invalid session');
			}

			const refreshTokenId = decoded.jti;
			if (!refreshTokenId) {
				logger.warn('[LOGOUT] Missing token ID');
				throw createHttpError(401, 'Invalid session');
			}

			await this.tokenService.deleteRefreshToken(refreshTokenId);
			res.clearCookie('accessToken');
			res.clearCookie('refreshToken');

			logger.info('[LOGOUT] Session ended successfully');
			return res.status(200).json({
				success: true,
				message: 'Logged out successfully',
			});
		} catch (error) {
			logger.error('[LOGOUT] Failed to logout');
			if (Config.NODE_ENV !== 'production') logger.debug(error);
			next(createHttpError(500, 'Logout failed'));
		}
	}
}
