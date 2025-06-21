import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/confiig/data-source';
describe('POST auth/register', () => {
	describe('Given all fields', () => {
		const user = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'roshan@gmail.com',
			password: 'password123',
			role: 'customer',
		};
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
		});

		// This will run after all tests in this block
		afterAll(async () => {
			await connection.destroy();
		});

		it('should return 201 status code', async () => {
			// AAA
			// 1. Arrange
			// 2. Act
			const response = await request(app)
				.post('/auth/register')
				.send(user);
			// 3.Assert
			expect(response.statusCode).toBe(201);
		});

		it('should return valid JSON response', async () => {
			const response = await request(app)
				.post('/auth/register')
				.send(user);
			expect(response.headers['content-type']).toMatch(/json/);
		});
		it('should persist user in the database', async () => {
			await request(app).post('/auth/register').send(user);
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users.length).toBe(1);
			expect(users[0].firstName).toBe(user.firstName);
			expect(users[0].lastName).toBe(user.lastName);
			expect(users[0].email).toBe(user.email);
		});

		it('should return a valid userId in response', async () => {
			const response = await request(app)
				.post('/auth/register')
				.send(user);
			expect(response.body.userId).toBeDefined();
			expect(typeof response.body.userId).toBe('number');
		});

		it('should assign customer role', async () => {
			await request(app).post('/auth/register').send(user);
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users[0]).toHaveProperty('role');
			expect(users[0].role).toBe('customer');
		});

		it('should hash the password', async () => {
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'roshan@gmail.com',
				password: 'password123',
			};
			await request(app).post('/auth/register').send(user);
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users[0].password).not.toBe(user.password);
			expect(users[0].password).toHaveLength(60); // bcrypt hashes are 60 characters long
			expect(users[0].password).toMatch(/^\$2[ayb]\$.{56}$/); // Matches bcrypt hash format
		});
		it('should return 400 status code for duplicate email', async () => {
			const userRepo = connection.getRepository('User');
			await userRepo.save(user);
			const response = await request(app)
				.post('/auth/register')
				.send(user);
			expect(response.statusCode).toBe(400);
			expect(response.body.message).toBe('Email already exists');
		});
	});

	describe('Missing some or all fields', () => {
		const user = {
			firstName: 'John',
			lastName: 'Doe',
			email: 'roshan@gmail.com',
			password: 'password123',
			role: 'customer',
		};

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
		});

		// This will run after all tests in this block
		afterAll(async () => {
			await connection.destroy();
		});

		it('should return 400 status code if email field is missing', async () => {
			const userWithoutEmail = {
				...user,
				email: '',
			};
			const response = await request(app)
				.post('/auth/register')
				.send(userWithoutEmail);
			expect(response.statusCode).toBe(400);
			expect(response.body.message).toBe('Email is required!');
		});
	});
});
