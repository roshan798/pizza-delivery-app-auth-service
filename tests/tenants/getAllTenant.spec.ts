import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { Roles } from '../../src/constants';
import { createUser, generateAccessToken } from '../utils';

describe('GET /tenants', () => {
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
		it('should return 200 and a list of tenants for authenticated admin', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			const tenantsToCreate = Array.from({ length: 10 }, (_, i) => ({
				name: `New Tenant ${i}`,
				address: `A new tenant address for testing ${i}`,
			}));

			await Promise.all(
				tenantsToCreate.map((tenant) =>
					request(app)
						.post('/tenants')
						.set('Cookie', [`accessToken=${token};`])
						.send(tenant)
						.expect(201)
				)
			);

			const response = await request(app)
				.get('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.expect(200);

			expect(response.body).toHaveProperty('tenants');
			expect(Array.isArray(response.body.tenants)).toBe(true);
			expect(response.body.tenants).toHaveLength(10);
		});

		it('should return correct tenant data format (id, name, address)', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.post('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.send({
					name: 'TestTenant',
					address: 'TestAddress',
				});

			const res = await request(app)
				.get('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.expect(200);

			const tenant = res.body.tenants[0];
			expect(tenant).toHaveProperty('id');
			expect(tenant).toHaveProperty('name', 'TestTenant');
			expect(tenant).toHaveProperty('address', 'TestAddress');
		});

		it('should return empty array if no tenants exist', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			const res = await request(app)
				.get('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.expect(200);

			expect(res.body).toHaveProperty('tenants');
			expect(Array.isArray(res.body.tenants)).toBe(true);
			expect(res.body.tenants).toHaveLength(0);
		});
	});

	describe('Sad Path: Missing or invalid fields / Unauthorized access', () => {
		it('should return 401 if no access token is provided', async () => {
			await request(app).get('/tenants').expect(401);
		});

		it('should return 403 if user role is CUSTOMER', async () => {
			const user = await createUser(connection, Roles.CUSTOMER);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.get('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.expect(403);
		});

		it('should return 403 if user role is MANAGER', async () => {
			const user = await createUser(connection, Roles.MANAGER);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.get('/tenants')
				.set('Cookie', [`accessToken=${token};`])
				.expect(403);
		});
	});
});
