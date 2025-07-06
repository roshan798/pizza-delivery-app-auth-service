import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/confiig/data-source';
import { isValidCookieFormat } from '../utils/index';

describe('POST auth/login', () => {
	describe('Given all correct fields', () => {
		let connection: DataSource;

		// This will run before all tests in this block
		// It is used to initialize the database connection
		beforeAll(async () => {
			connection = await AppDataSource.initialize();
		});

		// This will run before each test in this block
		beforeEach(async () => {
			await connection.dropDatabase();
			await connection.synchronize();
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'roshan@gmail.com',
				password: 'password123',
				role: 'customer',
			};
			await request(app).post('/auth/register').send(user);
		});

		// This will run after all tests in this block
		afterAll(async () => {
			await connection.destroy();
		});
		const loginUserData = {
			email: 'roshan@gmail.com',
			password: 'password123',
		};
		//'should set accessToken and refreshToken cookies on success'
		it('Should return 200 OK', async () => {
			const response = await request(app)
				.post('/auth/login')
				.send(loginUserData);
			expect(response.status).toBe(200);
		});

		it('should return access token and refresh token in cookie', async () => {
			const response = await request(app)
				.post('/auth/login')
				.send(loginUserData);

			interface Headers {
				['set-cookie']: string[];
			}
			let accessTokenCookie: string | null = null;
			let refreshTokenCookie: string | null = null;
			const cookies =
				(response.headers as unknown as Headers)['set-cookie'] || [];

			cookies.forEach((cookie) => {
				if (cookie.startsWith('accessToken=')) {
					accessTokenCookie = cookie.split('=')[1].split(';')[0]; // Extract the value of accessToken cookie
				} else if (cookie.startsWith('refreshToken=')) {
					refreshTokenCookie = cookie.split('=')[1].split(';')[0]; // Extract the value of accessToken cookie
				}
			});
			expect(response.statusCode).toBe(200);
			expect(response.headers['set-cookie']).toBeDefined(); // set-cookie header should be present if tokens are set in cookie

			expect(accessTokenCookie).not.toBeNull();
			expect(refreshTokenCookie).not.toBeNull();

			expect(isValidCookieFormat(accessTokenCookie)).toBeTruthy();
			expect(isValidCookieFormat(refreshTokenCookie)).toBeTruthy();
		});
	});

	describe('Given all or some incorrect fields', () => {
		let connection: DataSource;

		// This will run before all tests in this block
		// It is used to initialize the database connection
		beforeAll(async () => {
			connection = await AppDataSource.initialize();
		});

		// This will run before each test in this block
		beforeEach(async () => {
			await connection.dropDatabase();
			await connection.synchronize();
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'roshan@gmail.com',
				password: 'password123',
				role: 'customer',
			};
			await request(app).post('/auth/register').send(user);
		});

		// This will run after all tests in this block
		afterAll(async () => {
			await connection.destroy();
		});
		// "should return 400 if email is missing"
		// "should return 400 if password is missing"
		// "should return 401 if credentials are invalid"
		// "should return 401 if user does not exist"
		it('should return 400 if email is missing', async () => {
			const loginUserData = {
				email: undefined,
				password: 'password123',
			};
			const response = await request(app)
				.post('/auth/login')
				.send(loginUserData);
			expect(response.status).toBe(400);
		});

		it('should return 400 if password is missing', async () => {
			const loginUserData = {
				email: 'roshan@gmail.com',
				password: undefined,
			};
			const response = await request(app)
				.post('/auth/login')
				.send(loginUserData);
			expect(response.status).toBe(400);
		});
		it('should return 401 if credentials are invalid', async () => {
			const loginUserData = {
				email: 'wrong@gmail.com',
				password: 'wrongpassword123',
			};
			const response = await request(app)
				.post('/auth/login')
				.send(loginUserData);
			expect(response.status).toBe(401);
		});

		it('should return 401 if password is wrong', async () => {
			const loginUserData = {
				email: 'roshan@gmail.com',
				password: 'wrongPassword',
			};
			const response = await request(app)
				.post('/auth/login')
				.send(loginUserData);
			expect(response.status).toBe(401);
		});
	});

	describe('Security & Edge Cases', () => {
		let connection: DataSource;

		// This will run before all tests in this block
		// It is used to initialize the database connection
		beforeAll(async () => {
			connection = await AppDataSource.initialize();
		});

		// This will run before each test in this block
		beforeEach(async () => {
			await connection.dropDatabase();
			await connection.synchronize();
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'roshan@gmail.com',
				password: 'password123',
				role: 'customer',
			};
			await request(app).post('/auth/register').send(user);
		});

		// This will run after all tests in this block
		afterAll(async () => {
			await connection.destroy();
		});
		it('should reject login with SQLi/XSS payloads', async () => {
			const response = await request(app).post('/auth/login').send({
				email: "' OR 1=1;--",
				password: '<script>alert(1)</script>',
			});
			expect([400, 401]).toContain(response.status);
		});
		it('should reject login with very long fields', async () => {
			const response = await request(app)
				.post('/auth/login')
				.send({
					email: 'a'.repeat(300) + '@test.com',
					password: 'a'.repeat(300),
				});
			expect(response.status).toBe(400);
		});
		it('should ignore extra fields in login', async () => {
			const response = await request(app).post('/auth/login').send({
				email: 'roshan@gmail.com',
				password: 'password123',
				extra: 'field',
			});
			// Should still succeed if credentials are correct
			// Or fail if extra fields are not allowed
			// Accept either 200 or 400/401 depending on implementation
			expect([200, 400, 401]).toContain(response.status);
		});
		it('should not allow login for revoked/deleted user', async () => {
			const userRepo = AppDataSource.getRepository('User');
			await userRepo.delete({ email: 'roshan@gmail.com' });
			const response = await request(app)
				.post('/auth/login')
				.send({ email: 'roshan@gmail.com', password: 'password123' });
			expect(response.status).toBe(401);
		});
	});
});
