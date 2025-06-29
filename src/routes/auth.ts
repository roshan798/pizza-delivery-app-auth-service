import express, { Response, Request, NextFunction } from 'express';
import { AuthController } from '../controllers/AuthController';
import { UserService } from '../services/UserService';
import { AppDataSource } from '../confiig/data-source';
import { User } from '../entity/User';
import { HashService } from '../services/HashService';
import registerValidator from '../validators/register-validators';
import { TokenService } from '../services/TokenService';
import { RefreshToken } from '../entity/RefreshToken';
import loginValidators from '../validators/login-validators';
import { CredentialService } from '../services/CredentialService';
import authenticate from '../middlewares/authenticate';
import { AuthRequest } from '../types';

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
const hashService = new HashService();
const userService = new UserService(userRepository, hashService);
const tokenService = new TokenService(refreshTokenRepo);
const credentialService = new CredentialService();
const authController = new AuthController(
	userService,
	tokenService,
	credentialService
);

router.post(
	'/register',
	registerValidator,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			await authController.register(req, res, next);
		} catch (err) {
			next(err);
		}
	}
);

router.post(
	'/login',
	loginValidators,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			await authController.login(req, res, next);
		} catch (err) {
			next(err);
		}
	}
);

router.get(
	'/self',
	authenticate,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			await authController.self(req as AuthRequest, res, next);
		} catch (err) {
			next(err);
		}
	}
);
export default router;
