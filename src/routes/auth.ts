import express, { Response, Request, NextFunction } from 'express';
import { AuthController } from '../controllers/AuthController';
import { UserService } from '../services/UserService';
import { AppDataSource } from '../confiig/data-source';
import { User } from '../entity/User';
import { HashService } from '../services/HashService';
import registerValidator from '../validators/register-validators';

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const hashService = new HashService();
const userService = new UserService(userRepository, hashService);
const authController = new AuthController(userService);

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
