import fs from 'node:fs';
import path from 'node:path';
import { JwtPayload, sign } from 'jsonwebtoken';
import logger from '../confiig/logger';
import createHttpError from 'http-errors';
import { Config } from '../confiig';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entity/RefreshToken';
import { User as UserType } from '../types/index';

export interface Payload {
	userId: string;
	role: string;
}
export class TokenService {
	constructor(private refreshTokenRepo: Repository<RefreshToken>) {}
	generateAccessToken(payload: Payload) {
		logger.info('Entering generateAccessToken of TokenService');
		let privateKey: Buffer;

		try {
			privateKey = fs.readFileSync(
				path.join(__dirname, '../../certs/privateKey.pem')
			);
		} catch (error) {
			logger.error('Error loading private key');
			logger.error(error);
			const err = createHttpError(500, 'Error while reading private key');
			throw err;
		}
		const tokenPayload: JwtPayload = {
			sub: payload.userId,
			role: payload.role,
		};
		const accessToken = sign(tokenPayload, privateKey, {
			algorithm: 'RS256',
			expiresIn: '1h',
			issuer: 'auth-service',
		});

		return accessToken;
	}

	generateRefreshToken(payload: Payload, userId: number) {
		logger.info('Entering generateRefreshToken of TokenService');
		const tokenPayload: JwtPayload = {
			sub: payload.userId,
			role: payload.role,
		};
		const refreshToken = sign(tokenPayload, Config.JWT_SECRET!, {
			algorithm: 'HS256',
			expiresIn: '30 days',
			issuer: 'auth-service',
			jwtid: userId.toString(),
		});

		return refreshToken;
	}

	async persistRefreshToken(user: UserType) {
		const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365; // TODO : 366 if leap year
		const newRefreshToken = await this.refreshTokenRepo.save({
			user: user,
			expiresAt: new Date(Date() + MS_IN_YEAR),
		});
		return newRefreshToken;
	}
}
