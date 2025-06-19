import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { User as UserType, UserData } from '../types';
import logger from '../confiig/logger';

export class UserService {
	constructor(private userRepo: Repository<User>) {}
	async create(userData: UserData) {
		logger.info(`Creating user with data: ${JSON.stringify(userData)}`);
		const savedUser: UserType = await this.userRepo.save(userData);
		logger.info(`User created with ID: ${savedUser.id}`);
		return savedUser;
	}
}
