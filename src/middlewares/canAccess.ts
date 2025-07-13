import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export default function canAccess(roles: string[]) {
	return (_req: Request, res: Response, next: NextFunction) => {
		const req = _req as AuthRequest;
		const roleFromRequest = req.auth?.role;
		if (!roleFromRequest) {
			res.status(403).json({ message: 'Access denied' });
			return;
		}

		const hasAccess = roles.includes(roleFromRequest);
		if (!hasAccess) {
			res.status(403).json({ message: 'Access denied' });
			return;
		}

		next();
	};
}
