import request from 'supertest';
import app from '../../src/app';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { AppDataSource } from '../../src/config/data-source';
import { DataSource } from 'typeorm';
import { Roles } from '../../src/constants';
import { createUser, generateAccessToken } from '../utils/index';

describe('GET /users', () => {
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

	describe('Happy path', () => {
		it('should return 200 and list of users for ADMIN', async () => {
			const adminUser = await createUser(connection, Roles.ADMIN);
			await createUser(connection, Roles.MANAGER);
			const accessToken = generateAccessToken(jwks, adminUser);

			const res = await request(app)
				.get('/users')
				.set('Cookie', [`accessToken=${accessToken}`]);

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('users');
			const users = res.body.users;
			expect(Array.isArray(users)).toBe(true);
			expect(users.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Sad paths', () => {
		it('should return 403 for MANAGER or CUSTOMER', async () => {
			const managerUser = await createUser(connection, Roles.MANAGER);
			const accessToken = generateAccessToken(jwks, managerUser);

			const res = await request(app)
				.get('/users')
				.set('Cookie', [`accessToken=${accessToken}`]);

			expect(res.status).toBe(403);
		});

		it('should return 401 if no access token provided', async () => {
			const res = await request(app).get('/users');
			expect(res.status).toBe(401);
		});

		it('should return 401 for invalid token', async () => {
			const res = await request(app)
				.get('/users')
				.set('Cookie', ['accessToken=invalid.token.here']);

			expect(res.status).toBe(401);
		});
	});

	describe('TODOs', () => {
		it.todo('should support filtering by tenantId');
		it.todo('should support pagination (limit, offset)');
		it.todo('should return empty array if no users exist');
		it.todo(
			'should allow admin to filter users by role (e.g., only CUSTOMERS or MANAGERS or CUSTOMERS and  MANAGERS)'
		);
	});
});
