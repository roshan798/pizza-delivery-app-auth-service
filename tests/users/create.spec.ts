import request from 'supertest';
import app from '../../src/app';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { AppDataSource } from '../../src/config/data-source';
import { DataSource } from 'typeorm';
import { Roles } from '../../src/constants';
import { User } from '../../src/entity/User';
import { createUser, generateAccessToken } from '../utils/index';

async function createTenant(connection: DataSource, overrides = {}) {
	const tenantRepo = connection.getRepository('Tenant');
	return tenantRepo.save({
		name: 'test tenant',
		address: 'test',
		...overrides,
	});
}

function buildNewUser() {
	return {
		firstName: 'mangal',
		lastName: 'panday',
		email: 'mangal@gmail.com',
		password: 'password123',
		tenantId: 1 as number | undefined, // will be overridden with a real tenant in tests
	};
}

describe('POST /users', () => {
	describe('Given all correct fields', () => {
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

		it('should return 201 status code', async () => {
			const savedUser = await createUser(connection, Roles.ADMIN);
			const accessToken = generateAccessToken(jwks, savedUser);

			const tenant = await createTenant(connection);
			const newUser = buildNewUser();
			newUser.tenantId = tenant.id;

			const res = await request(app)
				.post('/users')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send(newUser);

			expect(res.status).toBe(201);
		});

		it('should return userId in response', async () => {
			const savedUser = await createUser(connection, Roles.ADMIN);
			const accessToken = generateAccessToken(jwks, savedUser);

			const tenant = await createTenant(connection);
			const newUser = buildNewUser();
			newUser.tenantId = tenant.id;

			const res = await request(app)
				.post('/users')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send(newUser)
				.expect(201);

			expect(res.body).toHaveProperty('id');
		});

		it('should persist user in DB', async () => {
			const savedUser = await createUser(connection, Roles.ADMIN);
			const accessToken = generateAccessToken(jwks, savedUser);

			const tenant = await createTenant(connection);
			const newUser = buildNewUser();
			newUser.tenantId = tenant.id;

			const res = await request(app)
				.post('/users')
				.set('Cookie', [`accessToken=${accessToken};`])
				.send(newUser)
				.expect(201);

			const userRepo = AppDataSource.getRepository(User);
			const foundUser = await userRepo.findOneBy({ id: res.body.id });

			expect(foundUser).toBeTruthy();
			expect(foundUser!.firstName).toBe(newUser.firstName);
			expect(foundUser!.lastName).toBe(newUser.lastName);
			expect(foundUser!.email).toBe(newUser.email);
			expect(foundUser!.password).not.toBe(newUser.password);
		});
	});

	describe('Fields are missing', () => {
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

		it('should return 403 if user is not admin', async () => {
			const newUser = buildNewUser();
			const savedUser = await createUser(connection, Roles.CUSTOMER);
			const accessToken = generateAccessToken(jwks, savedUser);

			const res = await request(app)
				.post('/users')
				.set('Cookie', [`accessToken=${accessToken}`])
				.send(newUser);

			expect(res.status).toBe(403);
		});

		it('should only create MANAGER user if user is admin', async () => {
			const newUser = buildNewUser();
			const userRepo = AppDataSource.getRepository(User);

			const savedUser = await createUser(AppDataSource, Roles.ADMIN);
			const accessToken = generateAccessToken(jwks, savedUser);

			const tenant = await createTenant(connection);
			newUser.tenantId = tenant.id;

			const res = await request(app)
				.post('/users')
				.set('Cookie', [`accessToken=${accessToken}`])
				.send(newUser);

			expect(res.status).toBe(201);

			const created = await userRepo.findOneBy({ id: res.body.id });
			expect(created!.role).toBe(Roles.MANAGER);
		});

		it('should return 400 if required fields are missing', async () => {
			const savedUser = await createUser(connection, Roles.ADMIN);
			const accessToken = generateAccessToken(jwks, savedUser);

			const res = await request(app)
				.post('/users')
				.set('Cookie', [`accessToken=${accessToken}`])
				.send({
					// missing email and password
					firstName: 'Ram',
					lastName: 'Charan',
					tenantId: 1,
				});

			expect(res.status).toBe(400);
		});

		it('should not create user if email is already taken', async () => {
			const newUser = buildNewUser();
			const savedUser = await createUser(connection, Roles.ADMIN);
			const accessToken = generateAccessToken(jwks, savedUser);

			const tenant = await createTenant(connection);
			newUser.tenantId = tenant.id;

			// Create initial user
			await request(app)
				.post('/users')
				.set('Cookie', [`accessToken=${accessToken}`])
				.send(newUser)
				.expect(201);

			// Try creating another user with same email
			const res = await request(app)
				.post('/users')
				.set('Cookie', [`accessToken=${accessToken}`])
				.send(newUser);

			expect(res.status).toBe(400);
		});

		it('should return 401 if access token is missing', async () => {
			const newUser = buildNewUser();
			const res = await request(app).post('/users').send(newUser);
			expect(res.status).toBe(401);
		});

		it('should return 401 if access token is invalid', async () => {
			const newUser = buildNewUser();
			const res = await request(app)
				.post('/users')
				.set('Cookie', ['accessToken=invalid.token.here'])
				.send(newUser);

			expect(res.status).toBe(401);
		});

		it('should return 400 if tenantId does not exist', async () => {
			const savedUser = await createUser(connection, Roles.ADMIN);
			const accessToken = generateAccessToken(jwks, savedUser);

			const newUser = buildNewUser();
			newUser.email = 'newemail@example.com';
			newUser.tenantId = 9999; // non-existent tenant

			const res = await request(app)
				.post('/users')
				.set('Cookie', [`accessToken=${accessToken}`])
				.send(newUser);

			expect(res.status).toBe(400);
		});
		it('should return 400 if admin tries to create manager without tenantId', async () => {
			const savedUser = await createUser(connection, Roles.ADMIN);
			const accessToken = generateAccessToken(jwks, savedUser);

			const newUser = buildNewUser();
			newUser.email = 'managerwithouttenant@example.com'; // unique email
			delete newUser.tenantId;

			const res = await request(app)
				.post('/users')
				.set('Cookie', [`accessToken=${accessToken}`])
				.send(newUser);

			expect(res.status).toBe(400);
			// Optionally check the validation message
			expect(res.body.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ msg: 'Tenant ID is required!' }),
				])
			);
		});
	});
});
