import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { User } from '../../src/entity/User';
import { createAdminUser } from '../../src/utils';

describe('createAdminUser', () => {
	let connection: DataSource;
	beforeAll(async () => {
		connection = await AppDataSource.initialize();
	});

	afterAll(async () => {
		await connection.destroy();
	});

	beforeEach(async () => {
		await connection.dropDatabase();
		await connection.synchronize();
	});

	it('should create an admin user if none exists', async () => {
		await createAdminUser();
		const admin = await AppDataSource.getRepository(User).findOne({
			where: { role: 'admin' },
		});
		expect(admin).toBeDefined();
		expect(admin?.email).toBe(
			process.env.ADMIN_EMAIL || 'admin@system.local'
		);
	});

	it('should not create duplicate admins', async () => {
		await createAdminUser();
		await createAdminUser();
		const admins = await AppDataSource.getRepository(User).find({
			where: { role: 'admin' },
		});
		expect(admins.length).toBe(1);
	});
});
