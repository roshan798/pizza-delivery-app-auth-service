import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { Tenant } from '../../src/entity/Tenant';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { Roles } from '../../src/constants';
import { User } from '../../src/entity/User';

describe('POST /tenants', () => {
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

		const tenantData = {
			name: 'test',
			address: 'test address',
		};

		it('should return 201 and have tenat Id property for authenticated admin user', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			const response = await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({
					name: 'New Tenant',
					address: 'A new tenant address for testing',
				})
				.expect(201);

			expect(response.body).toHaveProperty('id');
		});

		it('should store the tenant in the DB', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send(tenantData);

			const tenantRepo = connection.getRepository(Tenant);
			const savedTenant = await tenantRepo.find();
			expect(savedTenant.length).toBe(1);
			expect(savedTenant[0].name).toBe(tenantData.name);
			expect(savedTenant[0].address).toBe(tenantData.address);
		});

		it('should trim and store tenant name/address correctly', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			const res = await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({
					name: '   Trim Test   ',
					address: '   123 Test St   ',
				})
				.expect(201);

			const tenantRepo = connection.getRepository(Tenant);
			const tenant = await tenantRepo.findOneBy({ id: res.body.id });
			expect(tenant?.name).toBe('Trim Test');
			expect(tenant?.address).toBe('123 Test St');
		});

		it('should ignore unknown fields and create tenant', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			const res = await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({
					name: 'Known',
					address: 'Known Address',
					unknown: 'field',
				})
				.expect(201);

			expect(res.body).not.toHaveProperty('unknown');
		});

		it('should allow tenants with same name but different address', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({ name: 'SameName', address: 'Address 1' })
				.expect(201);

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({ name: 'SameName', address: 'Address 2' })
				.expect(201);
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

		it('should return 400 for missing name', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({ address: 'Valid Address' })
				.expect(400);
		});

		it('should return 400 for invalid data', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({ name: '', address: 'Valid Address' })
				.expect(400);
		});

		it('should return 401 for unauthenticated user', async () => {
			await request(app)
				.post('/tenants')
				.send({ name: 'test tenant', address: 'Valid tenant data' })
				.expect(401);
		});

		it('should return 403 for Role CUSTOMER', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save({
				...user,
				role: Roles.CUSTOMER,
			});
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({ name: 'test tenant', address: 'Valid tenant data' })
				.expect(403);
		});

		it('should return 403 for Role MANAGER', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save({
				...user,
				role: Roles.MANAGER,
			});
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({ name: 'test tenant', address: 'Valid tenant data' })
				.expect(403);
		});

		it('should return 400 for empty request body', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({})
				.expect(400);
		});

		it('should return 400 for non-string name', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({ name: 12345, address: 'Valid address' })
				.expect(400);
		});

		it('should return 400 for overlength name field', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			const longName = 'A'.repeat(256);
			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send({ name: longName, address: 'Valid address' })
				.expect(400);
		});
	});
});
