import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { User as UserType, UserData } from '../types';
import logger from '../confiig/logger';
import createHttpError from 'http-errors';
import { Roles } from '../constants';
import { HashService } from './HashService';

export class UserService {
	constructor(
		private userRepo: Repository<User>,
		private hashService: HashService
	) {}
	async create({ firstName, lastName, email, password }: UserData) {
		try {
			logger.info(
				`Creating user with data: ${JSON.stringify({ firstName, lastName, email })}`
			);

			const hashedPassword =
				await this.hashService.hashPassword(password);
			const userData = {
				firstName,
				lastName,
				email,
				password: hashedPassword,
				role: Roles.CUSTOMER,
			};
			const savedUser: UserType = await this.userRepo.save(userData);
			logger.info(`User created with ID: ${savedUser.id}`);
			return savedUser;
		} catch (err) {
			if (err instanceof createHttpError.HttpError) {
				logger.error(`HTTP error creating user: ${err.message}`);
				throw err;
			} else if (err instanceof Error) {
				logger.error(`Error creating user: ${err.message}`);
			} else {
				logger.error(`Error creating user: ${JSON.stringify(err)}`);
			}
			const error = createHttpError(500, 'Failed to create user');
			throw error;
		}
	}

	async getUserByEmail(email: string) {
		logger.info('Entering into getUserByEmail of UserService');
		try {
			const user = await this.userRepo
				.createQueryBuilder('user')
				.where('user.email = :email', { email: email })
				.getOne();
			if (!user) {
				throw createHttpError(401, 'Email or Password does not match!');
			}
			return user;
		} catch (err) {
			if (err instanceof createHttpError.HttpError) {
				logger.error(`user not found : ${err.message}`);
				throw err;
			} else if (err instanceof Error) {
				logger.error(`user not found : ${err.message}`);
			} else {
				logger.error(`user not found : ${JSON.stringify(err)}`);
			}
			const error = createHttpError(500, 'Failed to create user');
			throw error;
		}
	}
}
