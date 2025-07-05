import { NextFunction, Response } from 'express';
import logger from '../confiig/logger';
import { AuthRequest, LoginUserRequest, RegisterUserRequest } from '../types';
import { UserService } from '../services/UserService';
import { Payload, TokenService } from '../services/TokenService';
import { CredentialService } from '../services/CredentialService';
import { validationResult } from 'express-validator';
import createHttpError from 'http-errors';

export class AuthController {
	constructor(
		private userService: UserService,
		private tokenService: TokenService,
		private credentialService: CredentialService
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

			const payload: Payload = {
				userId: savedUser.id.toString(),
				role: savedUser.role,
			};
			const accessToken = this.tokenService.generateAccessToken(payload);
			const newRefreshToken =
				await this.tokenService.persistRefreshToken(savedUser);
			const refreshToken = this.tokenService.generateRefreshToken(
				payload,
				newRefreshToken.id
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
				success: true,
				id: responseData.userId,
			});
		} catch (err) {
			next(err);
		}
	}

	async login(req: LoginUserRequest, res: Response, next: NextFunction) {
		logger.info('Login endpoint hit');
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
			const { email, password } = req.body;
			logger.debug('request body', {
				email,
				password: '*******',
			});

			const savedUser = await this.userService.getUserByEmail(email);
			const match = await this.credentialService.comparePassword(
				password,
				savedUser.password
			);
			if (!match) {
				next(createHttpError(401, 'Email or Password does not match!'));
				return;
			}

			const payload: Payload = {
				userId: savedUser.id.toString(),
				role: savedUser.role,
			};
			const accessToken = this.tokenService.generateAccessToken(payload);
			const newRefreshToken =
				await this.tokenService.persistRefreshToken(savedUser);
			const refreshToken = this.tokenService.generateRefreshToken(
				payload,
				newRefreshToken.id
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

			const responseData = {
				userId: savedUser.id,
				firstName: savedUser.firstName,
				lastName: savedUser.lastName,
				email: savedUser.email,
			};
			logger.info(
				`User logged in successfully: ${JSON.stringify(responseData)}`
			);

			res.status(200).json({
				message: 'Login successful',
				success: true,
				id: responseData.userId,
			});
		} catch (err) {
			next(err);
		}
	}

	async self(req: AuthRequest, res: Response, next: NextFunction) {
		try {
			const { sub: userId } = req.auth;
			const user = await this.userService.findById(Number(userId));
			res.json({
				success: true,
				user: { ...user, password: undefined },
			});
		} catch (err: unknown) {
			const error = createHttpError(
				500,
				'Something bad happend : ' + (err as Error).message
			);
			next(error);
		}
	}

	async refresh(req: AuthRequest, res: Response, next: NextFunction) {
		logger.info('Refresh endpoint hit');

		try {
			const { sub: userId, role, jti: tokenId } = req.auth;
			logger.debug(
				`User ID: ${userId}, Role: ${role}, Token ID: ${tokenId}`
			);
			const user = await this.userService.findById(Number(userId));
			const payload: Payload = {
				userId: user.id.toString(),
				role: user.role,
			};
			const accessToken = this.tokenService.generateAccessToken(payload);
			await this.tokenService.deleteRefreshToken(tokenId!);
			const newRefreshToken =
				await this.tokenService.persistRefreshToken(user);
			// remove the old One
			const refreshToken = this.tokenService.generateRefreshToken(
				payload,
				newRefreshToken.id
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

			return res.json({
				success: true,
				msg: 'Tokens refreshed successfully!',
			});
		} catch (error) {
			next(error);
		}
	}
}
