import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/config/data-source';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { Roles } from '../../src/constants';
import { createUser, createTenant, generateAccessToken } from '../utils';

describe('GET /tenants/:id', () => {
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
		it('should return correct tenant data format (id, name, address)', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);
			const tenant = await createTenant(token);

			const res = await request(app)
				.get(`/tenants/${tenant.id}`)
				.set('Cookie', [`accessToken=${token};`])
				.expect(200);

			expect(res.body).toHaveProperty('tenant');
			const result = res.body.tenant;
			expect(result).toHaveProperty('id', tenant.id);
			expect(result).toHaveProperty('name', 'TestTenant');
			expect(result).toHaveProperty('address', 'TestAddress');
		});
	});

	describe('Sad Path: Missing or invalid fields / Unauthorized access', () => {
		it('should return 401 if no access token is provided', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);
			const tenant = await createTenant(token);

			await request(app).get(`/tenants/${tenant.id}`).expect(401);
		});

		it('should return 403 if user role is CUSTOMER', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const tokenAdmin = generateAccessToken(jwks, admin);
			const tenant = await createTenant(tokenAdmin);

			const customer = await createUser(connection, Roles.CUSTOMER);
			const tokenCustomer = generateAccessToken(jwks, customer);

			await request(app)
				.get(`/tenants/${tenant.id}`)
				.set('Cookie', [`accessToken=${tokenCustomer};`])
				.expect(403);
		});

		it('should return 403 if user role is MANAGER', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const tokenAdmin = generateAccessToken(jwks, admin);
			const tenant = await createTenant(tokenAdmin);

			const manager = await createUser(connection, Roles.MANAGER);
			const tokenManager = generateAccessToken(jwks, manager);

			await request(app)
				.get(`/tenants/${tenant.id}`)
				.set('Cookie', [`accessToken=${tokenManager};`])
				.expect(403);
		});

		it('should return 404 if tenant ID does not exist', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.get('/tenants/99999')
				.set('Cookie', [`accessToken=${token};`])
				.expect(404);
		});

		it('should return 400 if tenant ID is not a number', async () => {
			const user = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, user);

			await request(app)
				.get('/tenants/abc')
				.set('Cookie', [`accessToken=${token};`])
				.expect(400);
		});
	});
});
