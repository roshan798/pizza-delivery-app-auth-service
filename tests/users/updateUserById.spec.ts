import request from 'supertest';
import app from '../../src/app';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { AppDataSource } from '../../src/config/data-source';
import { DataSource } from 'typeorm';
import { Roles } from '../../src/constants';
import { createTenant, createUser, generateAccessToken } from '../utils';

describe('PUT /users/:id', () => {
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
		// Inside Happy Path
		it('should update all editable fields successfully', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const customer = await createUser(connection, Roles.CUSTOMER);
			const token = generateAccessToken(jwks, admin);

			// Create another tenant to test tenant update

			await createTenant(token);

			const res = await request(app)
				.put(`/users/${customer.id}`)
				.set('Cookie', [`accessToken=${token}`])
				.send({
					firstName: 'UpdatedFirst',
					lastName: 'UpdatedLast',
					email: 'updated@example.com',
				});

			expect(res.status).toBe(200);
			expect(res.body.user.firstName).toBe('UpdatedFirst');
			expect(res.body.user.lastName).toBe('UpdatedLast');
			expect(res.body.user.email).toBe('updated@example.com');
		});

		it('should update email only', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const customer = await createUser(connection, Roles.CUSTOMER, {
				firstName: 'First',
				lastName: 'Last',
				email: 'user@old.com',
				password: 'password123',
				role: Roles.CUSTOMER,
			});
			const token = generateAccessToken(jwks, admin);

			const res = await request(app)
				.put(`/users/${customer.id}`)
				.set('Cookie', [`accessToken=${token}`])
				.send({
					email: 'user@new.com',
				});

			expect(res.status).toBe(200);
			expect(res.body.user.email).toBe('user@new.com');
			expect(res.body.user.firstName).toBe('First');
			expect(res.body.user.lastName).toBe('Last');
		});
	});

	describe('Sad paths', () => {
		it('should return 403 for MANAGER or CUSTOMER', async () => {
			const manager = await createUser(connection, Roles.MANAGER);
			const customer = await createUser(connection, Roles.CUSTOMER);
			const token = generateAccessToken(jwks, manager);

			const res = await request(app)
				.put(`/users/${customer.id}`)
				.set('Cookie', [`accessToken=${token}`])
				.send({ firstName: 'Try Update' });

			expect(res.status).toBe(403);
		});

		it('should return 401 if no token is provided', async () => {
			const customer = await createUser(connection, Roles.CUSTOMER);
			const res = await request(app)
				.put(`/users/${customer.id}`)
				.send({ firstName: 'Try Update' });

			expect(res.status).toBe(401);
		});

		it('should return 401 for invalid token', async () => {
			const res = await request(app)
				.put('/users/1')
				.set('Cookie', ['accessToken=invalid.token'])
				.send({ firstName: 'Try Update' });

			expect(res.status).toBe(401);
		});

		it('should return 404 if user does not exist', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);

			const res = await request(app)
				.put('/users/9999')
				.set('Cookie', [`accessToken=${token}`])
				.send({ firstName: 'Try Update' });

			expect(res.status).toBe(404);
		});

		it('should return 400 for invalid ID format', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);

			const res = await request(app)
				.put('/users/invalid-id')
				.set('Cookie', [`accessToken=${token}`])
				.send({ firstName: 'Try Update' });

			expect(res.status).toBe(400);
		});

		it('should return 400 for invalid payload', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const customer = await createUser(connection, Roles.CUSTOMER);
			const token = generateAccessToken(jwks, admin);

			const res = await request(app)
				.put(`/users/${customer.id}`)
				.set('Cookie', [`accessToken=${token}`])
				.send({ firstName: '' });

			expect(res.status).toBe(400);
		});
	});
});
