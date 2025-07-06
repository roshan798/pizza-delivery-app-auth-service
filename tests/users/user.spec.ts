import request from 'supertest';
import app from '../../src/app';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { AppDataSource } from '../../src/confiig/data-source';
import { DataSource } from 'typeorm';
import { User } from '../../src/entity/User';
describe('GET auth/self', () => {
	describe('Given all correct fields', () => {
		let connection: DataSource;
		let jwks: JWKSMock;
		// This will run before all tests in this block
		// It is used to initialize the database connection
		beforeAll(async () => {
			connection = await AppDataSource.initialize();
			jwks = createJWKSMock('http://localhost:8080');
		});

		// This will run before each test in this block
		beforeEach(async () => {
			await connection.dropDatabase();
			await connection.synchronize();
			jwks.start();
		});

		afterEach(async () => {
			jwks.stop();
		});

		// This will run after all tests in this block
		afterAll(async () => {
			await connection.destroy();
		});
		it('should return 200 status code', async () => {
			// register user
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'roshan@gmail.com',
				password: 'password123',
				role: 'customer',
			};
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			const res = await request(app)
				.get('/auth/self')
				.set('Cookie', [`accessToken=${accessToken};`]);

			expect(res.status).toBe(200);
		});

		it('should return user data', async () => {
			// register user
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'roshan@gmail.com',
				password: 'password123',
				role: 'customer',
			};
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			const res = await request(app)
				.get('/auth/self')
				.set('Cookie', [`accessToken=${accessToken};`]);

			expect(res.body).toHaveProperty('user');
			expect(res.body.user.id).toBe(savedUser.id);
		});
		it('should not return users password', async () => {
			// register user
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'roshan@gmail.com',
				password: 'password123',
				role: 'customer',
			};
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save(user);
			const accessToken = jwks.token({
				sub: String(savedUser.id),
				role: savedUser.role,
			});

			const res = await request(app)
				.get('/auth/self')
				.set('Cookie', [`accessToken=${accessToken};`]);

			expect(res.body).toHaveProperty('user');
			expect(res.body.user).not.toHaveProperty('password');
		});

		it('should return 401 status code', async () => {
			// register user
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'roshan@gmail.com',
				password: 'password123',
				role: 'customer',
			};
			const userRepo = AppDataSource.getRepository(User);
			await userRepo.save(user);

			const res = await request(app).get('/auth/self');

			expect(res.status).toBe(401);
		});
		describe('Security & Edge Cases', () => {
			it('should return 401 for tampered JWT', async () => {
				const userRepo = AppDataSource.getRepository(User);
				const savedUser = await userRepo.save({
					firstName: 'Tampered',
					lastName: 'JWT',
					email: 'tamperedjwt@test.com',
					password: 'password123',
					role: 'customer',
				});
				const accessToken =
					'tampered.' +
					Buffer.from(
						JSON.stringify({
							sub: savedUser.id,
							role: savedUser.role,
						})
					)
						.toString('base64')
						.concat('.signature');
				const res = await request(app)
					.get('/auth/self')
					.set('Cookie', [`accessToken=${accessToken};`]);
				expect([401, 400]).toContain(res.status);
			});
		});
	});
});
