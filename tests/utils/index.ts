import { DataSource } from 'typeorm';
import { User } from '../../src/entity/User';
import request from 'supertest';
import app from '../../src/app';
import { JWKSMock } from 'mock-jwks';

export const truncateTables = async (connection: DataSource) => {
	const entities = connection.entityMetadatas;
	for (const entity of entities) {
		const repository = connection.getRepository(entity.name);
		await repository.clear();
	}
};

export function isValidCookieFormat(cookie: string | null): boolean {
	if (cookie === null) return false;

	const parts = cookie.split('.');
	if (parts.length !== 3) return false; // JWT should have 3 parts
	parts.forEach((part) => {
		try {
			Buffer.from(part, 'base64').toString(); // Validate base64 encoding
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (e) {
			return false; // If JSON parsing fails, it's not a valid JWT
		}
	});
	return true; // If all parts are valid, it's a valid JWT
}

export const createUser = async (connection: DataSource, role: string) => {
	const userRepo = connection.getRepository(User);
	return await userRepo.save({
		firstName: 'John',
		lastName: 'Doe',
		email: `${role.toLowerCase()}@example.com`,
		password: 'password123',
		role,
	});
};

type Tenant = {
	id: string;
	name: string;
	address: string;
	createdAt: Date;
	updatedAt: Date;
};

export const createTenant = async (token: string) => {
	const res = await request(app)
		.post('/tenants')
		.set('Cookie', [`accessToken=${token};`])
		.send({
			name: 'TestTenant',
			address: 'TestAddress',
		});
	return res.body as Tenant;
};

export const generateAccessToken = (jwks: JWKSMock, user: User) =>
	jwks.token({ sub: String(user.id), role: user.role });
