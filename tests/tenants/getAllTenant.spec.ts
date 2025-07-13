import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { Roles } from '../../src/constants';
import { User } from '../../src/entity/User';

describe('GET /tenants', () => {
	describe('Happy Path: Given all valid fields', () => {
		let connection: DataSource;
		let jwks: JWKSMock;

		beforeAll(async () => {
			connection = await AppDataSource.initialize();
			jwks = createJWKSMock('http://localhost:8080');
		});

		beforeEach(async () => {
			await connection.dropDatabase();
			await connection.synchronize();
			jwks.start();
		});

		afterEach(async () => {
			jwks.stop();
		});

		afterAll(async () => {
			await connection.destroy();
		});

		const user = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'roshan@gmail.com',
			password: 'password123',
			role: Roles.ADMIN,
		};

		it('should return 200 and a list of tenants for authenticated admin', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);

			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			const tenantsToCreate = Array.from({ length: 10 }, (_, i) => ({
				name: `New Tenant ${i}`,
				address: `A new tenant address for testing ${i}`,
			}));

			await Promise.all(
				tenantsToCreate.map((tenant) =>
					request(app)
						.post('/tenants')
						.set('Cookie', [`accessToken=${accessToken};`])
						.send(tenant)
						.expect(201)
				)
			);

			const response = await request(app)
				.get('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.expect(200);

			expect(response.body).toHaveProperty('tenants');
			expect(Array.isArray(response.body.tenants)).toBe(true);
			expect(response.body.tenants).toHaveLength(10);
		});

		it('should return correct tenant data format (id, name, address)', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({
					name: 'TestTenant',
					address: 'TestAddress',
				});

			const res = await request(app)
				.get('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.expect(200);

			const tenant = res.body.tenants[0];
			expect(tenant).toHaveProperty('id');
			expect(tenant).toHaveProperty('name', 'TestTenant');
			expect(tenant).toHaveProperty('address', 'TestAddress');
		});

		it('should return empty array if no tenants exist', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			const res = await request(app)
				.get('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.expect(200);

			expect(res.body).toHaveProperty('tenants');
			expect(Array.isArray(res.body.tenants)).toBe(true);
			expect(res.body.tenants).toHaveLength(0);
		});
	});

	describe('Sad Path: Missing or invalid fields / Unauthorized access', () => {
		let connection: DataSource;
		let jwks: JWKSMock;

		beforeAll(async () => {
			connection = await AppDataSource.initialize();
			jwks = createJWKSMock('http://localhost:8080');
		});

		beforeEach(async () => {
			await connection.dropDatabase();
			await connection.synchronize();
			jwks.start();
		});

		afterEach(async () => {
			jwks.stop();
		});

		afterAll(async () => {
			await connection.destroy();
		});

		it('should return 401 if no access token is provided', async () => {
			await request(app).get('/tenants').expect(401);

			// expect(res.body).toHaveProperty('error');
		});

		it('should return 403 if user role is CUSTOMER', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const customer = await userRepo.save({
				firstName: 'John',
				lastName: 'Doe',
				email: 'customer@example.com',
				password: 'password123',
				role: Roles.CUSTOMER,
			});

			const accessToken = jwks.token({
				sub: String(customer.id),
				role: customer.role,
			});

			await request(app)
				.get('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.expect(403);

			// expect(res.body).toHaveProperty('error');
		});

		it('should return 403 if user role is MANAGER', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const manager = await userRepo.save({
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'manager@example.com',
				password: 'password123',
				role: Roles.MANAGER,
			});

			const accessToken = jwks.token({
				sub: String(manager.id),
				role: manager.role,
			});

			await request(app)
				.get('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.expect(403);

			// expect(res.body).toHaveProperty('error');
		});
	});
});
