import { expressjwt } from 'express-jwt';
import jwksClient from 'jwks-rsa';
import { Config } from '../confiig';
import { Request } from 'express';

export default expressjwt({
	secret: jwksClient.expressJwtSecret({
		jwksUri: Config.JWKS_URI!,
		cache: true,
		rateLimit: true,
	}),
	algorithms: ['RS256'],
	getToken(req: Request) {
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader.split(' ')[1] !== undefined) {
			const token = authHeader.split(' ')[1];
			if (token) {
				return token;
			}
		}
		interface AuthCookie {
			accessToken: string;
		}
		const { accessToken: token } = req.cookies as AuthCookie;
		return token;
	},
});
