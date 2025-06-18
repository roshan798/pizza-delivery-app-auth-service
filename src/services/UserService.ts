import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { UserData } from '../types';

export class UserService {
	constructor(private userRepo: Repository<User>) {}
	async create(userData: UserData) {
		userData = await this.userRepo.save(userData);
		return userData;
	}
}
