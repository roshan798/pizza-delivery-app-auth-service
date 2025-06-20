import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { UserService } from '../services/UserService';
import { AppDataSource } from '../confiig/data-source';
import { User } from '../entity/User';
import { HashService } from '../services/HashService';

const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const hashService = new HashService();
const userService = new UserService(userRepository, hashService);
const authController = new AuthController(userService);

router.post('/register', (req, res, next) =>
	authController.register(req, res, next)
);

export default router;
