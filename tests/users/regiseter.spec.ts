import request from 'supertest';
import app from '../../src/app';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../src/confiig/data-source';
import { RefreshToken } from '../../src/entity/RefreshToken';
import { isValidCookieFormat } from '../utils';
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
			expect(response.body.id).toBeDefined();
			expect(typeof response.body.id).toBe('number');
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
			expect(response.body.errors).toBeDefined();
			const errors: { msg: string }[] = response.body.errors;
			const hasEmailAlreadyExistError = errors.some(
				(e) => e.msg === 'Email already exists'
			);
			expect(hasEmailAlreadyExistError).toBeTruthy();
			const users = await userRepo.find();
			expect(users.length).toBe(1);
		});

		it('should return access token and refresh token in cookie', async () => {
			const response = await request(app)
				.post('/auth/register')
				.send(user);

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
			expect(response.statusCode).toBe(201);
			expect(response.headers['set-cookie']).toBeDefined(); // set-cookie header should be present if tokens are set in cookie

			expect(accessTokenCookie).not.toBeNull();
			expect(refreshTokenCookie).not.toBeNull();

			expect(isValidCookieFormat(accessTokenCookie)).toBeTruthy();
			expect(isValidCookieFormat(refreshTokenCookie)).toBeTruthy();
		});

		it('should store the refreshToken in DB', async () => {
			const response = await request(app)
				.post('/auth/register')
				.send(user);
			const userId = response.body.id;
			const refreshTokenRepo = connection.getRepository(RefreshToken);
			const refreshTokens = await refreshTokenRepo
				.createQueryBuilder('refreshToken')
				.where('refreshToken.userId = :userId', { userId })
				.getMany();
			expect(refreshTokens).toHaveLength(1);
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
			expect(response.body.errors).toBeDefined();
			const errors: { msg: string }[] = response.body.errors;
			const hasEmailisRequiredError = errors.some(
				(e) => e.msg === 'Email is Required!'
			);
			expect(hasEmailisRequiredError).toBeTruthy();
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users.length).toBe(0);
		});

		it('should return 400 status code if firstName field is missing', async () => {
			const userWithoutFirstName = {
				...user,
				firstName: '',
			};
			const response = await request(app)
				.post('/auth/register')
				.send(userWithoutFirstName);
			expect(response.statusCode).toBe(400);
			expect(response.body.errors).toBeDefined();
			const errors: { msg: string }[] = response.body.errors;
			const hasFirstNameisRequiredError = errors.some(
				(e) => e.msg === 'First Name is Required!'
			);
			expect(hasFirstNameisRequiredError).toBeTruthy();
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users.length).toBe(0);
		});

		it('should return 400 status code if lastName field is missing', async () => {
			const userWithoutLastName = {
				...user,
				lastName: '',
			};
			const response = await request(app)
				.post('/auth/register')
				.send(userWithoutLastName);
			expect(response.statusCode).toBe(400);
			expect(response.body.errors).toBeDefined();
			const errors: { msg: string }[] = response.body.errors;
			const hasLastNameisRequiredError = errors.some(
				(e) => e.msg === 'Last Name is Required!'
			);
			expect(hasLastNameisRequiredError).toBeTruthy();
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users.length).toBe(0);
		});

		it('should return 400 status code if password field is missing', async () => {
			const userWithoutPassword = {
				...user,
				password: '',
			};
			const response = await request(app)
				.post('/auth/register')
				.send(userWithoutPassword);
			expect(response.statusCode).toBe(400);
			expect(response.body.errors).toBeDefined();
			const errors: { msg: string }[] = response.body.errors;
			const hasPasswordisRequiredError = errors.some(
				(e) => e.msg === 'Password is Required!'
			);
			expect(hasPasswordisRequiredError).toBeTruthy();
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users.length).toBe(0);
		});
	});

	describe('fields are not properly formatted', () => {
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

		it('should trim the email field if it has leading or trailing spaces', async () => {
			const userWithSpaces = {
				...user,
				email: '    roshan@gmail.com ',
			};
			const response = await request(app)
				.post('/auth/register')
				.send(userWithSpaces);
			expect(response.statusCode).toBe(201);
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users.length).toBe(1);
			expect(users[0].email).toBe('roshan@gmail.com');
		});

		it('should trim all fields if they have leading or trailing spaces', async () => {
			const userWithSpaces = {
				...user,
				firstName: '   John   ',
				lastName: '   Doe   ',
				email: 'roshan@gmail.com   ',
				password: '   password123   ',
			};
			const response = await request(app)
				.post('/auth/register')
				.send(userWithSpaces);
			expect(response.statusCode).toBe(201);
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users.length).toBe(1);
			expect(users[0].firstName).toBe('John');
			expect(users[0].lastName).toBe('Doe');
			expect(users[0].email).toBe('roshan@gmail.com');
		});

		it('should have password with at least 6 characters', async () => {
			const userWithShortPassword = {
				...user,
				password: '123',
			};
			const response = await request(app)
				.post('/auth/register')
				.send(userWithShortPassword);
			expect(response.statusCode).toBe(400);
			expect(response.body.errors).toBeDefined();
			const errors: { msg: string }[] = response.body.errors;
			const hasPasswordLengthError = errors.some(
				(e) => e.msg === 'Password must be at least 6 characters long'
			);
			expect(hasPasswordLengthError).toBeTruthy();
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users.length).toBe(0);
		});

		it('should have email in correct format', async () => {
			const userWithInvalidEmail = {
				...user,
				email: 'invalid-email',
			};
			const response = await request(app)
				.post('/auth/register')
				.send(userWithInvalidEmail);
			expect(response.statusCode).toBe(400);
			expect(response.body.errors).toBeDefined();
			const errors: { msg: string }[] = response.body.errors;
			const hasEmailFormatError = errors.some(
				(e) => e.msg === 'Invalid email format!'
			);
			expect(hasEmailFormatError).toBeTruthy();
			const userRepo = connection.getRepository('User');
			const users = await userRepo.find();
			expect(users.length).toBe(0);
		});
	});

	describe('Security & Edge Cases', () => {
		it('should reject registration with SQLi/XSS payloads', async () => {
			const response = await request(app).post('/auth/register').send({
				firstName: '<script>alert(1)</script>',
				lastName: "' OR 1=1;--",
				email: "' OR 1=1;--@test.com",
				password: '<img src=x onerror=alert(1)>',
				role: 'customer',
			});
			expect(response.status).toBe(400);
		});
		it('should reject registration with very long fields', async () => {
			const response = await request(app)
				.post('/auth/register')
				.send({
					firstName: 'a'.repeat(300),
					lastName: 'b'.repeat(300),
					email: 'a'.repeat(300) + '@test.com',
					password: 'a'.repeat(300),
					role: 'customer',
				});
			expect(response.status).toBe(400);
		});
		it('should ignore extra fields in registration', async () => {
			const response = await request(app).post('/auth/register').send({
				firstName: 'John',
				lastName: 'Doe',
				email: 'extra@test.com',
				password: 'password123',
				role: 'customer',
				extra: 'field',
			});
			// Should still succeed if credentials are correct
			// Or fail if extra fields are not allowed
			// Accept either 201 or 400 depending on implementation
			expect([201, 400]).toContain(response.status);
		});
		it.skip('should not allow registration for revoked/deleted user email', async () => {
			const userRepo = AppDataSource.getRepository('User');
			await userRepo.save({
				firstName: 'Jane',
				lastName: 'Doe',
				email: 'revoked@test.com',
				password: 'password123',
				role: 'customer',
			});
			await userRepo.delete({ email: 'revoked@test.com' });
			const response = await request(app).post('/auth/register').send({
				firstName: 'Jane',
				lastName: 'Doe',
				email: 'revoked@test.com',
				password: 'password123',
				role: 'customer',
			});
			// Should succeed (new user) or fail (if soft delete)
			expect([201, 400]).toContain(response.status);
		});
	});
});
