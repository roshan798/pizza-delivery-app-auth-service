import { JwtPayload, sign } from 'jsonwebtoken';
import logger from '../config/logger';
import createHttpError from 'http-errors';
import { Config } from '../config';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entity/RefreshToken';
import { User as UserType } from '../types/index';
import { Response } from 'express';

export interface Payload {
	userId: string;
	role: string;
}

export class TokenService {
	private readonly ACCESS_TOKEN_MAX_AGE = 60 * 60 * 1000; // 1 hour
	private readonly REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
	private readonly DOMAIN = Config.DOMAIN;
	private readonly SAME_SITE: 'strict' | 'lax' | 'none' = 'strict';
	private readonly ACCESS_TOKEN_EXPIRES_IN = '1h';
	private readonly REFRESH_TOKEN_EXPIRES_IN = '30 days';

	constructor(private readonly refreshTokenRepo: Repository<RefreshToken>) {}

	generateAccessToken(payload: Payload): string {
		logger.info('Generating access token');

		let privateKey: string;
		try {
			if (!Config.RSA_PRIVATE_KEY) {
				throw createHttpError(
					500,
					'Internal error during token generation'
				);
			}
			privateKey = Config.RSA_PRIVATE_KEY.replace(/\\n/g, '\n');
		} catch (error) {
			logger.error('Could not read signing key for access token');
			if (Config.NODE_ENV !== 'production') {
				logger.debug(error);
			}
			throw createHttpError(
				500,
				'Internal error during token generation'
			);
		}

		const tokenPayload: JwtPayload = {
			sub: payload.userId,
			role: payload.role,
		};

		const accessToken = sign(tokenPayload, privateKey, {
			algorithm: 'RS256',
			expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
			issuer: 'auth-service',
		});

		logger.debug('Access token created');
		return accessToken;
	}

	generateRefreshToken(payload: Payload, tokenId: string): string {
		logger.info('Generating refresh token');

		const tokenPayload: JwtPayload = {
			id: tokenId,
			sub: payload.userId,
			role: payload.role,
		};
		const refreshToken = sign(tokenPayload, Config.JWT_SECRET!, {
			algorithm: 'HS256',
			expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
			issuer: 'auth-service',
			jwtid: tokenId.toString(),
		});
		logger.debug('Refresh token created');
		return refreshToken;
	}

	async persistRefreshToken(user: UserType): Promise<RefreshToken> {
		logger.info(`Persisting refresh token for user`);

		const MS_IN_YEAR = this.REFRESH_TOKEN_MAX_AGE;
		const newRefreshToken = await this.refreshTokenRepo.save({
			user,
			expiresAt: new Date(Date.now() + MS_IN_YEAR),
		});
		logger.debug('Refresh token persisted');
		return newRefreshToken;
	}

	async deleteRefreshToken(tokenId: string): Promise<void> {
		logger.info('Deleting existing refresh token');
		await this.refreshTokenRepo.delete(tokenId);
		logger.debug('Refresh token deleted');
	}

	addAccessToken(res: Response, payload: Payload): void {
		logger.info('Setting access token cookie');
		const accessToken = this.generateAccessToken(payload);

		res.cookie('accessToken', accessToken, {
			httpOnly: true,
			maxAge: this.ACCESS_TOKEN_MAX_AGE,
			domain: this.DOMAIN,
			sameSite: this.SAME_SITE,
		});
	}

	async addRefreshToken(
		res: Response,
		payload: Payload,
		user: UserType,
		tokenId?: string
	): Promise<void> {
		if (tokenId) {
			logger.info(
				'Previous refresh token detected. Deleting before issuing a new one.'
			);
			await this.deleteRefreshToken(tokenId);
		}

		logger.info('Issuing new refresh token');
		const newRefreshToken = await this.persistRefreshToken(user);
		const refreshToken = this.generateRefreshToken(
			payload,
			newRefreshToken.id
		);

		res.cookie('refreshToken', refreshToken, {
			httpOnly: true,
			maxAge: this.REFRESH_TOKEN_MAX_AGE,
			domain: this.DOMAIN,
			sameSite: this.SAME_SITE,
		});
	}
}
