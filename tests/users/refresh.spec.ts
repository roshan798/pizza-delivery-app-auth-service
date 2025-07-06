import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { Config } from '../../src/confiig';
import { AppDataSource } from '../../src/confiig/data-source';
import { DataSource } from 'typeorm';
import { User } from '../../src/entity/User';
import { RefreshToken } from '../../src/entity/RefreshToken';

describe('POST /auth/refresh', () => {
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

	it('should refresh tokens when access token is expired and refresh token is valid', async () => {
		const userRepo = AppDataSource.getRepository(User);
		const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

		const savedUser = await userRepo.save({
			firstName: 'Test',
			lastName: 'User',
			email: 'test@example.com',
			password: 'securepassword',
			role: 'customer',
		});

		const refreshTokenEntity = await refreshTokenRepo.save({
			user: savedUser,
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
		});

		// Create expired access token (RS256 using JWKS)
		const expiredAccessToken = jwks.token({
			sub: savedUser.id.toString(),
			role: savedUser.role,
			exp: Math.floor(Date.now() / 1000) - 60, // expired 1 min ago
		});

		// Create valid refresh token (HS256 using app secret)
		const validRefreshToken = jwt.sign(
			{
				id: refreshTokenEntity.id,
				sub: savedUser.id.toString(),
				role: savedUser.role,
			},
			Config.JWT_SECRET!,
			{
				algorithm: 'HS256',
				expiresIn: '1h',
				issuer: 'auth-service',
				jwtid: refreshTokenEntity.id.toString(),
			}
		);

		const res = await request(app)
			.post('/auth/refresh')
			.set('Cookie', [
				`accessToken=${expiredAccessToken}; HttpOnly`,
				`refreshToken=${validRefreshToken}; HttpOnly`,
			]);

		expect(res.status).toBe(200);

		expect(res.headers['set-cookie']).toEqual(
			expect.arrayContaining([
				expect.stringMatching(/^accessToken=.*HttpOnly/),
				expect.stringMatching(/^refreshToken=.*HttpOnly/),
			])
		);

		// Old refresh token should be removed from DB
		const old = await refreshTokenRepo.findOneBy({
			id: refreshTokenEntity.id,
		});
		expect(old).toBeNull();
	});

	describe('Security & Edge Cases', () => {
		it('should reject refresh with tampered JWT', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save({
				firstName: 'Test',
				lastName: 'User',
				email: 'tampered@test.com',
				password: 'password123',
				role: 'customer',
			});
			const refreshToken = jwt.sign(
				{ id: '999', sub: savedUser.id, role: savedUser.role },
				'wrongsecret',
				{ expiresIn: '1h' }
			);
			const res = await request(app)
				.post('/auth/refresh')
				.set('Cookie', [`refreshToken=${refreshToken}; HttpOnly`]);
			expect([401, 400]).toContain(res.status);
		});
		it('should reject refresh with reused refresh token', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
			const savedUser = await userRepo.save({
				firstName: 'Test',
				lastName: 'User',
				email: 'reuse@test.com',
				password: 'password123',
				role: 'customer',
			});
			const savedToken = await refreshTokenRepo.save({
				user: savedUser,
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
			// First use
			await request(app)
				.post('/auth/refresh')
				.set('Cookie', [`refreshToken=${refreshToken}; HttpOnly`]);
			// Second use (should fail)
			const res = await request(app)
				.post('/auth/refresh')
				.set('Cookie', [`refreshToken=${refreshToken}; HttpOnly`]);
			expect([401, 400]).toContain(res.status);
		});
		it('should reject refresh with expired refresh token', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const savedUser = await userRepo.save({
				firstName: 'Test',
				lastName: 'User',
				email: 'expired@test.com',
				password: 'password123',
				role: 'customer',
			});
			const expiredToken = jwt.sign(
				{ id: 'expired', sub: savedUser.id, role: savedUser.role },
				Config.JWT_SECRET!,
				{ expiresIn: -10 }
			);
			const res = await request(app)
				.post('/auth/refresh')
				.set('Cookie', [`refreshToken=${expiredToken}; HttpOnly`]);
			expect([401, 400]).toContain(res.status);
		});
		it('should return 401 if no cookies are sent', async () => {
			const res = await request(app).post('/auth/refresh');
			expect(res.status).toBe(401);
		});
	});
});
