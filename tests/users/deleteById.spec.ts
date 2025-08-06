import request from 'supertest';
import app from '../../src/app';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { AppDataSource } from '../../src/config/data-source';
import { DataSource } from 'typeorm';
import { Roles } from '../../src/constants';
import { createUser, generateAccessToken } from '../utils';

describe('DELETE /users/:id', () => {
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
		it('should delete a user when requested by an admin', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const userToDelete = await createUser(connection, Roles.CUSTOMER);
			const token = generateAccessToken(jwks, admin);

			const res = await request(app)
				.delete(`/users/${userToDelete.id}`)
				.set('Cookie', [`accessToken=${token}`]);

			expect(res.status).toBe(200);
			// expect(res.body.message).toMatch(/deleted/i);
		});
	});

	describe('Sad paths', () => {
		it('should return 403 for MANAGER or CUSTOMER', async () => {
			const manager = await createUser(connection, Roles.MANAGER);
			const customer = await createUser(connection, Roles.CUSTOMER);
			const token = generateAccessToken(jwks, manager);

			const res = await request(app)
				.delete(`/users/${customer.id}`)
				.set('Cookie', [`accessToken=${token}`]);

			expect(res.status).toBe(403);
		});

		it('should return 401 if no token is provided', async () => {
			const customer = await createUser(connection, Roles.CUSTOMER);

			const res = await request(app).delete(`/users/${customer.id}`);

			expect(res.status).toBe(401);
		});

		it('should return 401 for invalid token', async () => {
			const res = await request(app)
				.delete('/users/1')
				.set('Cookie', ['accessToken=invalid.token']);

			expect(res.status).toBe(401);
		});

		it('should return 404 if user does not exist', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);

			const res = await request(app)
				.delete('/users/9999')
				.set('Cookie', [`accessToken=${token}`]);

			expect(res.status).toBe(404);
		});

		it('should return 400 for invalid ID format', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);

			const res = await request(app)
				.delete('/users/invalid-id')
				.set('Cookie', [`accessToken=${token}`]);

			expect(res.status).toBe(400);
		});
	});
});
