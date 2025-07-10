import { expressjwt } from 'express-jwt';
import { Config } from '../config';
import { Request } from 'express';
import logger from '../config/logger';
import { AuthCookie } from '../types';
import { AppDataSource } from '../config/data-source';
import { RefreshToken } from '../entity/RefreshToken';
import { Jwt } from 'jsonwebtoken';

export default expressjwt({
	secret: Config.JWT_SECRET!,
	algorithms: ['HS256'],
	getToken(req: Request) {
		logger.info(
			'Entering into getToken method of validateRefreshToken middleware'
		);
		const { refreshToken: token } = (req.cookies as AuthCookie) || {};
		if (!token) {
			logger.debug(`🍪 Refresh Token not found in cookie.`);
		}
		logger.debug(`🍪 Refresh Token from cookie: ${token}`);
		return token;
	},
	async isRevoked(req: Request, token: Jwt | undefined) {
		try {
			if (
				!token ||
				typeof token.payload !== 'object' ||
				token.payload === null
			) {
				logger.warn('Token is missing or payload is invalid.');
				return true;
			}
			const { id, sub } = token.payload as { id?: string; sub?: string };
			logger.info(`Token payload: id=${id}, sub=${sub}`);
			if (!id || !sub) {
				logger.warn('Token payload missing id or sub.');
				return true;
			}
			const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

			logger.debug(
				`Checking refresh token existence: id=${id}, userId=${sub}`
			);
			const tokenExists = await refreshTokenRepo.findOne({
				where: {
					id: id,
					user: {
						id: Number(sub),
					},
				},
			});

			if (!tokenExists) {
				logger.info(
					`Refresh token not found in DB: id=${id}, userId=${sub}`
				);
			} else {
				logger.debug(`Refresh token found: id=${id}, userId=${sub}`);
			}

			return !tokenExists;
		} catch (error: unknown) {
			logger.error('Error in isRevoked:', error);
			return true;
		}
	},
});
