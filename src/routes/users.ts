import express, { Response, Request, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import { HashService } from '../services/HashService';
import authenticate from '../middlewares/authenticate';
import canAccess from '../middlewares/canAccess';
import { UserController } from '../controllers/UserController';
import { Roles } from '../constants';
import { createUserValidator } from '../validators/users-validators';

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const hashService = new HashService();
const userService = new UserService(userRepository, hashService);
const userController = new UserController(userService);

router.post(
	'/',
	authenticate,
	canAccess([Roles.ADMIN]),
	createUserValidator,
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			await userController.createUser(req, res, next);
		} catch (err) {
			next(err);
		}
	}
);

export default router;
