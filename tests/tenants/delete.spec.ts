import request from 'supertest';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { AppDataSource } from '../../src/config/data-source';
import { DataSource } from 'typeorm';
import { createTenant, createUser, generateAccessToken } from '../utils';
import { Roles } from '../../src/constants';
import app from '../../src/app';
import { Tenant } from '../../src/entity/Tenant';

describe('DELETE /tenants/:id', () => {
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

	describe('Happy Path: Admin deletes a tenant', () => {
		it('should delete tenant and return 204 No Content', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);
			const { id } = await createTenant(token);

			await request(app)
				.delete(`/tenants/${id}`)
				.set('Cookie', [`accessToken=${token};`])
				.expect(204);
		});

		it('should remove tenant from DB', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);
			const { id } = await createTenant(token);

			await request(app)
				.delete(`/tenants/${id}`)
				.set('Cookie', [`accessToken=${token};`])
				.expect(204);

			const tenantRepo = AppDataSource.getRepository(Tenant);
			const tenant = await tenantRepo.findOne({ where: { id } });
			expect(tenant).toBeNull();
		});
	});

	describe('Sad Path: Unauthorized or invalid delete requests', () => {
		it('should return 401 if no access token is provided', async () => {
			await request(app).delete('/tenants/1').expect(401);
		});

		it('should return 403 if role is MANAGER', async () => {
			const manager = await createUser(connection, Roles.MANAGER);
			const token = generateAccessToken(jwks, manager);
			const admin = await createUser(connection, Roles.ADMIN);
			const tenant = await createTenant(generateAccessToken(jwks, admin));

			await request(app)
				.delete(`/tenants/${tenant.id}`)
				.set('Cookie', [`accessToken=${token};`])
				.expect(403);
		});

		it('should return 403 if role is CUSTOMER', async () => {
			const customer = await createUser(connection, Roles.CUSTOMER);
			const token = generateAccessToken(jwks, customer);
			const admin = await createUser(connection, Roles.ADMIN);
			const tenant = await createTenant(generateAccessToken(jwks, admin));

			await request(app)
				.delete(`/tenants/${tenant.id}`)
				.set('Cookie', [`accessToken=${token};`])
				.expect(403);
		});

		it('should return 400 if tenant ID is not a valid number', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);

			await request(app)
				.delete('/tenants/abc')
				.set('Cookie', [`accessToken=${token};`])
				.expect(400);
		});

		it('should return 404 if tenant ID does not exist', async () => {
			const admin = await createUser(connection, Roles.ADMIN);
			const token = generateAccessToken(jwks, admin);

			await request(app)
				.delete('/tenants/9999')
				.set('Cookie', [`accessToken=${token};`])
				.expect(404);
		});
	});
});
