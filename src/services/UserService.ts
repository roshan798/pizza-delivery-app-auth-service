import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { User as UserType, UserData } from '../types';
import logger from '../confiig/logger';
import createHttpError from 'http-errors';

export class UserService {
	constructor(private userRepo: Repository<User>) {}
	async create(userData: UserData) {
		try {
			logger.info(`Creating user with data: ${JSON.stringify(userData)}`);
			const savedUser: UserType = await this.userRepo.save(userData);
			logger.info(`User created with ID: ${savedUser.id}`);
			return savedUser;
		} catch (err) {
			if (err instanceof Error) {
				logger.error(`Error creating user: ${err.message}`);
			} else {
				logger.error(`Error creating user: ${JSON.stringify(err)}`);
			}
			const error = createHttpError(500, 'Failed to create user');
			throw error;
		}
	}
}
