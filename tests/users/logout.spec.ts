import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { Config } from '../../src/confiig';
import { AppDataSource } from '../../src/confiig/data-source';
import { DataSource } from 'typeorm';
import { User } from '../../src/entity/User';
import { RefreshToken } from '../../src/entity/RefreshToken';

describe('POST /auth/logout', () => {
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

	afterEach(() => jwks.stop());

	afterAll(async () => {
		await connection.destroy();
	});

	it('should logout user, clear cookies, and remove refresh token', async () => {
		const userRepo = AppDataSource.getRepository(User);
		const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

		const savedUser = await userRepo.save({
			firstName: 'Jane',
			lastName: 'Doe',
			email: 'jane@example.com',
			password: 'password123',
			role: 'customer',
		});

		const savedToken = await refreshTokenRepo.save({
			user: savedUser,
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
		});

		const accessToken = jwks.token({
			sub: savedUser.id.toString(),
			role: savedUser.role,
			exp: Math.floor(Date.now() / 1000) + 60 * 60, // valid for 1 hour
		});

		const refreshToken = jwt.sign(
			{
				id: savedToken.id,
				sub: savedUser.id.toString(),
				role: savedUser.role,
			},
			Config.JWT_SECRET!,
			{
				algorithm: 'HS256',
				expiresIn: '1h',
				issuer: 'auth-service',
				jwtid: savedToken.id.toString(),
			}
		);

		const res = await request(app)
			.post('/auth/logout')
			.set('Cookie', [
				`accessToken=${accessToken}; HttpOnly`,
				`refreshToken=${refreshToken}; HttpOnly`,
			]);

		expect(res.status).toBe(200);

		expect(res.headers['set-cookie']).toEqual(
			expect.arrayContaining([
				expect.stringMatching(/^refreshToken=;/),
				expect.stringMatching(/^accessToken=;/),
			])
		);

		const tokenInDb = await refreshTokenRepo.findOneBy({
			id: savedToken.id,
		});
		expect(tokenInDb).toBeNull();
	});

	it('should return 401 if refresh token is invalid or access token is expired', async () => {
		const expiredAccessToken = jwks.token({
			sub: '123',
			role: 'customer',
			exp: Math.floor(Date.now() / 1000) - 60, // expired 1 minute ago
		});

		const invalidRefreshToken = jwt.sign(
			{
				id: '9999',
				sub: '123',
				role: 'customer',
			},
			Config.JWT_SECRET!,
			{
				algorithm: 'HS256',
				expiresIn: '1h',
				issuer: 'auth-service',
				jwtid: '9999',
			}
		);

		const res = await request(app)
			.post('/auth/logout')
			.set('Cookie', [
				`accessToken=${expiredAccessToken}; HttpOnly`,
				`refreshToken=${invalidRefreshToken}; HttpOnly`,
			]);

		expect(res.status).toBe(401);
	});
});
