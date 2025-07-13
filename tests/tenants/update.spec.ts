import { DataSource } from 'typeorm';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { AppDataSource } from '../../src/config/data-source';
import { User } from '../../src/entity/User';
import { Roles } from '../../src/constants';
import request from 'supertest';
import app from '../../src/app';

// ─────────────────────────────
// ✅ Utility Functions (DRY)
// ─────────────────────────────
const createUser = async (connection: DataSource, role: string) => {
	const userRepo = connection.getRepository(User);
	return await userRepo.save({
		firstName: 'John',
		lastName: 'Doe',
		email: `${role.toLowerCase()}@example.com`,
		password: 'password123',
		role,
	});
};

const createTenant = async (token: string) => {
	const res = await request(app)
		.post('/tenants')
		.set('Cookie', [`accessToken=${token};`])
		.send({
			name: 'TestTenant',
			address: 'TestAddress',
		});
	return res.body;
};

const generateAccessToken = (jwks: JWKSMock, user: User) =>
	jwks.token({ sub: String(user.id), role: user.role });

describe('PUT /tenants/:id', () => {
	describe('Happy Path: Given all valid fields', () => {
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

		it('should update tenant name and address successfully', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);
			const { id } = await createTenant(token);

			const res = await request(app)
				.put(`/tenants/${id}`)
				.set('Cookie', [`accessToken=${token};`])
				.send({
					name: 'Updated Tenant Name',
					address: 'Updated Address',
				})
				.expect(200);

			expect(res.body).toHaveProperty('tenant');
			expect(res.body.tenant.name).toBe('Updated Tenant Name');
			expect(res.body.tenant.address).toBe('Updated Address');
		});

		it('should update tenant name and address in DB', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);
			const { id } = await createTenant(token);

			await request(app)
				.put(`/tenants/${id}`)
				.set('Cookie', [`accessToken=${token};`])
				.send({
					name: 'Updated From DB Test',
					address: 'Updated Address DB',
				})
				.expect(200);

			const tenantRes = await request(app)
				.get(`/tenants/${id}`)
				.set('Cookie', [`accessToken=${token};`])
				.expect(200);

			expect(tenantRes.body.tenant.name).toBe('Updated From DB Test');
			expect(tenantRes.body.tenant.address).toBe('Updated Address DB');
		});

		it('should return updated tenant data in response', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);
			const { id } = await createTenant(token);

			const res = await request(app)
				.put(`/tenants/${id}`)
				.set('Cookie', [`accessToken=${token};`])
				.send({
					name: 'Final Name',
					address: 'Final Address',
				})
				.expect(200);

			expect(res.body).toHaveProperty('tenant');
			expect(res.body.tenant.name).toBe('Final Name');
			expect(res.body.tenant.address).toBe('Final Address');
		});
	});

	describe('Sad Path: Missing or invalid fields / Unauthorized access', () => {
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

		it('should return 401 if no access token is provided', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);
			const { id } = await createTenant(token);

			await request(app)
				.put(`/tenants/${id}`)
				.send({
					name: 'NoToken',
					address: 'NoTokenAddr',
				})
				.expect(401);
		});

		it('should return 403 if role is MANAGER', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const manager = await createUser(connection, Roles.MANAGER);
			const adminToken = generateAccessToken(jwks, admin);
			const managerToken = generateAccessToken(jwks, manager);
			const { id } = await createTenant(adminToken);

			await request(app)
				.put(`/tenants/${id}`)
				.set('Cookie', [`accessToken=${managerToken};`])
				.send({ name: 'ManagerName', address: 'ManagerAddr' })
				.expect(403);
		});

		it('should return 403 if role is CUSTOMER', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const customer = await createUser(connection, Roles.CUSTOMER);
			const adminToken = generateAccessToken(jwks, admin);
			const customerToken = generateAccessToken(jwks, customer);
			const { id } = await createTenant(adminToken);

			await request(app)
				.put(`/tenants/${id}`)
				.set('Cookie', [`accessToken=${customerToken};`])
				.send({ name: 'CustomerName', address: 'CustomerAddr' })
				.expect(403);
		});

		it('should return 400 if tenant ID is not a valid number', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);

			await request(app)
				.put('/tenants/invalid-id')
				.set('Cookie', [`accessToken=${token};`])
				.send({ name: 'Bad', address: 'Bad' })
				.expect(400);
		});

		it('should return 404 if tenant ID does not exist', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);

			await request(app)
				.put('/tenants/999999')
				.set('Cookie', [`accessToken=${token};`])
				.send({ name: 'NotFound', address: 'Nowhere' })
				.expect(404);
		});

		it('should return 400 if required fields (name/address) are missing', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);
			const { id } = await createTenant(token);

			await request(app)
				.put(`/tenants/${id}`)
				.set('Cookie', [`accessToken=${token};`])
				.send({}) // Missing fields
				.expect(400);
		});

		it('should return 400 if invalid payload is provided', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);
			const { id } = await createTenant(token);

			await request(app)
				.put(`/tenants/${id}`)
				.set('Cookie', [`accessToken=${token};`])
				.send({ name: 123, address: null }) // Invalid types
				.expect(400);
		});
	});
});
