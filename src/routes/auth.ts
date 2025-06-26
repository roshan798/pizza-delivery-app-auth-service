import express, { Response, Request, NextFunction } from 'express';
import { AuthController } from '../controllers/AuthController';
import { UserService } from '../services/UserService';
import { AppDataSource } from '../confiig/data-source';
import { User } from '../entity/User';
import { HashService } from '../services/HashService';
import registerValidator from '../validators/register-validators';
import { TokenService } from '../services/TokenService';
import { RefreshToken } from '../entity/RefreshToken';

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
const hashService = new HashService();
const userService = new UserService(userRepository, hashService);
const tokenService = new TokenService(refreshTokenRepo);
const authController = new AuthController(userService, tokenService);

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

export default router;
