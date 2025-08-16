import bcrypt from 'bcrypt';
import { AppDataSource } from './config/data-source';
import { User } from './entity/User';
import logger from './config/logger';

const HASH_SALT_ROUNDS = 10;
export async function createAdminUser() {
	const userRepo = AppDataSource.getRepository(User);

	// check if admin already exists
	const existingAdmin = await userRepo.findOne({
		where: { role: 'admin' },
	});

	if (existingAdmin) {
		logger.info('Admin user already exists.');
		return;
	}

	const hashedPassword = await bcrypt.hash(
		process.env.ADMIN_PASSWORD || 'admin123',
		HASH_SALT_ROUNDS
	);

	const admin = userRepo.create({
		firstName: 'Super',
		lastName: 'Admin',
		email: process.env.ADMIN_EMAIL || 'admin@system.local',
		password: hashedPassword,
		role: 'admin',
	});

	await userRepo.save(admin);
	logger.info('Admin user created:', admin.email);
}
