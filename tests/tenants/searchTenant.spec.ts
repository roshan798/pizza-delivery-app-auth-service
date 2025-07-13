import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { Roles } from '../../src/constants';
import { User } from '../../src/entity/User';

// may add search queries in future
describe('GET /tenants/:id', () => {
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

		it('should return correct tenant data format (id, name, address)', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			const createRes = await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({
					name: 'TestTenant',
					address: 'TestAddress',
				})
				.expect(201);

			const res = await request(app)
				.get(`/tenants/${createRes.body.id}`)
				.set('Cookie', [`accessToken=${accessToken};`])
				.expect(200);

			expect(res.body).toHaveProperty('tenant');
			const tenant = res.body.tenant;
			expect(tenant).toHaveProperty('id');
			expect(tenant).toHaveProperty('name', 'TestTenant');
			expect(tenant).toHaveProperty('address', 'TestAddress');
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

		const user = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'roshan@gmail.com',
			password: 'password123',
			role: Roles.ADMIN,
		};
		it('should return 401 if no access token is provided', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			const createRes = await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({
					name: 'TestTenant',
					address: 'TestAddress',
				})
				.expect(201);

			await request(app).get(`/tenants/${createRes.body.id}`).expect(401);
		});

		it('should return 403 if user role is CUSTOMER', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});
			const createRes = await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({
					name: 'TestTenant',
					address: 'TestAddress',
				})
				.expect(201);

			const savedUserCustomer = await userRepo.save({
				...user,
				role: Roles.CUSTOMER,
			});
			const accessTokenCustomer = jwks.token({
				sub: String(savedUserCustomer.id),
				role: savedUserCustomer.role,
			});

			await request(app)
				.get(`/tenants/${createRes.body.id}`)
				.set('Cookie', [`accessToken=${accessTokenCustomer};`])
				.expect(403);
		});

		it('should return 403 if user role is MANAGER', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});
			const createRes = await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({
					name: 'TestTenant',
					address: 'TestAddress',
				})
				.expect(201);

			const savedUserCustomer = await userRepo.save({
				...user,
				role: Roles.MANAGER,
			});
			const accessTokenCustomer = jwks.token({
				sub: String(savedUserCustomer.id),
				role: savedUserCustomer.role,
			});

			await request(app)
				.get(`/tenants/${createRes.body.id}`)
				.set('Cookie', [`accessToken=${accessTokenCustomer};`])
				.expect(403);
		});

		it('should return 404 if tenant ID incorrect', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			await request(app)
				.get(`/tenants/99999`)
				.set('Cookie', [`accessToken=${accessToken};`])
				.expect(404);
		});

		it('should return 400 if tenant ID is not a number', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			await request(app)
				.get(`/tenants/abc`)
				.set('Cookie', [`accessToken=${accessToken};`])
				.expect(400);
		});
	});
});
