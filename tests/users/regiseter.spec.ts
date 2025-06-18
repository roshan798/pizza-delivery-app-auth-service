import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/confiig/data-source';
import { truncateTables } from '../utils';
describe('POST auth/register', () => {
	describe('Given all fields', () => {
		let connection: DataSource;

		// This will run before all tests in this block
		// It is used to initialize the database connection
		beforeAll(async () => {
			connection = await AppDataSource.initialize();
		});

		// This will run before each test in this block
		beforeEach(async () => {
			await truncateTables(connection);
		});

		// This will run after all tests in this block
		afterAll(async () => {
			await connection.destroy();
		});

		it('should return 201 status code', async () => {
			// AAA
			// 1. Arrange
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'test@email.com',
				password: 'password123',
			};
			// 2. Act
			const response = await request(app)
				.post('/auth/register')
				.send(user);
			// 3.Assert
			expect(response.statusCode).toBe(201);
		});

		it('should return valid JSON response', async () => {
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'test@email.com',
				password: 'password123',
			};
			const response = await request(app)
				.post('/auth/register')
				.send(user);
			expect(response.headers['content-type']).toMatch(/json/);
		});
		it('should persist user in the database', async () => {
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'test@email.com',
				password: 'password123',
			};
			await request(app).post('/auth/register').send(user);
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users.length).toBe(1);
			expect(users[0].firstName).toBe(user.firstName);
			expect(users[0].lastName).toBe(user.lastName);
			expect(users[0].email).toBe(user.email);
			expect(users[0].password).toBe(user.password);
		});
	});

	describe('Missing some or all fields', () => {});
});
