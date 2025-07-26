import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import logger from '../config/logger';

export default function canAccess(roles: string[]) {
	return (_req: Request, res: Response, next: NextFunction) => {
		const req = _req as AuthRequest;
		const roleFromRequest = req.auth?.role;

		if (!roleFromRequest) {
			logger.warn('Access denied: No role found in request');
			res.status(403).json({ message: 'Access denied' });
			return;
		}

		const hasAccess = roles.includes(roleFromRequest);
		if (!hasAccess) {
			logger.warn(
				`Access denied: Role "${roleFromRequest}" is not authorized`
			);
			res.status(403).json({ message: 'Access denied' });
			return;
		}

		logger.info(`Access granted: Role "${roleFromRequest}"`);
		next();
	};
}
