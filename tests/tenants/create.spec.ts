import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { Roles } from '../../src/constants';
import { createUser, generateAccessToken } from '../utils/index';

const tenantData = {
	name: 'test',
	address: 'test address',
};

describe('POST /tenants', () => {
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

	describe('Happy Path: Given all valid fields', () => {
		it('should return 201 and have tenant ID property for authenticated admin user', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			const response = await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({
					name: 'New Tenant',
					address: 'A new tenant address for testing',
				})
				.expect(201);

			expect(response.body).toHaveProperty('id');
		});

		it('should store the tenant in the DB', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send(tenantData)
				.expect(201);

			const tenants = await connection.getRepository('Tenant').find();
			expect(tenants.length).toBe(1);
			expect(tenants[0].name).toBe(tenantData.name);
			expect(tenants[0].address).toBe(tenantData.address);
		});

		it('should trim and store tenant name/address correctly', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			const res = await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({ name: '   Trim Test   ', address: '   123 Test St   ' })
				.expect(201);

			const tenant = await connection
				.getRepository('Tenant')
				.findOneBy({ id: res.body.id });

			expect(tenant?.name).toBe('Trim Test');
			expect(tenant?.address).toBe('123 Test St');
		});

		it('should ignore unknown fields and create tenant', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			const res = await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({
					name: 'Known',
					address: 'Known Address',
					unknown: 'field',
				})
				.expect(201);

			expect(res.body).not.toHaveProperty('unknown');
		});

		it('should allow tenants with same name but different address', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({ name: 'SameName', address: 'Address 1' })
				.expect(201);

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({ name: 'SameName', address: 'Address 2' })
				.expect(201);
		});
	});

	describe('Sad Path: Missing or invalid fields / Unauthorized access', () => {
		it('should return 400 for missing name', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({ address: 'Valid Address' })
				.expect(400);
		});

		it('should return 400 for invalid data', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
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
			const user = await createUser(connection, Roles.CUSTOMER);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({ name: 'test tenant', address: 'Valid tenant data' })
				.expect(403);
		});

		it('should return 403 for Role MANAGER', async () => {
			const user = await createUser(connection, Roles.MANAGER);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({ name: 'test tenant', address: 'Valid tenant data' })
				.expect(403);
		});

		it('should return 400 for empty request body', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({})
				.expect(400);
		});

		it('should return 400 for non-string name', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({ name: 12345, address: 'Valid address' })
				.expect(400);
		});

		it('should return 400 for overlength name field', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			const longName = 'A'.repeat(256);
			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({ name: longName, address: 'Valid address' })
				.expect(400);
		});
	});
});
