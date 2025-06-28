import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/confiig/data-source';

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
		it('Should return 200 OK and user details', async () => {
			const response = await request(app)
				.post('/auth/login')
				.send(loginUserData);
			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('user');
			expect(response.body.user.email).toBe('roshan@gmail.com');
			expect(response.body.user.firstName).toBe('John');
			expect(response.body.user.lastName).toBe('Doe');
		});
	});

	describe('Given all or some incorrect fields', () => {
		// "should return 400 if email is missing"
		// "should return 400 if password is missing"
		// "should return 401 if credentials are invalid"
		// "should return 401 if user does not exist"
	});
});
