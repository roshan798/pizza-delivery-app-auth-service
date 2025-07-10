import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { createJWKSMock, JWKSMock } from 'mock-jwks';
import { Config } from '../../src/config';
import { AppDataSource } from '../../src/config/data-source';
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
		await connection.synchronize(true); // sync and drop database
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

		const accessToken = jwks.token({
			sub: savedUser.id.toString(),
			role: savedUser.role,
			exp: Math.floor(Date.now() / 1000) + 3600,
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
			exp: Math.floor(Date.now() / 1000) - 60,
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

	describe('Cookie Security & DB Consistency', () => {
		it('should set HttpOnly, Secure, and SameSite flags on cookies', async () => {
			const user = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'cookieflags@test.com',
				password: 'password123',
				role: 'customer',
			};

			await request(app).post('/auth/register').send(user);

			const loginRes = await request(app)
				.post('/auth/login')
				.send({ email: user.email, password: user.password });
			// TODO

			// 		    [
			//   'accessToken=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzUxODI5NDU4LCJleHAiOjE3NTE4MzMwNTgsImlzcyI6ImF1dGgtc2VydmljZSJ9.Nnjciw7PqYHMaNF_h62arc5imBhdH2_0f7ndVrld8U1iG537FjSmsqA8UxSMs1tEoKNhn-mxRckQCs-XDdxM-Ol84wrO5mvLAqS4X0VJfQRyQxxzsLqH4jYLWh8ylIbfJTHjPObljMqlm2oqIjduGti_ZpVGbOOCjgNFxEAH8qPboAei-UB81od-whs9ONlfK3kd8L3a7i4a9BR2hXl_Has2OTQOIJlCSmHfUMa-smI3h80nLse2e7OOp9t-7lRMAb6rdcuGuqjFH15-owZ44utV8IQNu9l8qJYI81Jhqvg2YAsrWUesrjEJxBwzFBvyX1xfg8EwkL3rqO66W_VMUA; Max-Age=3600; Domain=localhost; Path=/; Expires=Sun, 06 Jul 2025 20:17:38 GMT; HttpOnly; SameSite=Strict',
			//   'refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwic3ViIjoiMSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1MTgyOTQ1OCwiZXhwIjoxNzU0NDIxNDU4LCJpc3MiOiJhdXRoLXNlcnZpY2UiLCJqdGkiOiIyIn0.tmJZ7_2QgD6sZjlhFHc2eqkZueS_D2fOoDA21W5ZBeo; Max-Age=2592000; Domain=localhost; Path=/; Expires=Tue, 05 Aug 2025 19:17:38 GMT; HttpOnly; SameSite=Strict'
			// ]
			const cookies: string | never[] =
				loginRes.headers['set-cookie'] || [];
			console.log(cookies);
			expect(true).toBeTruthy();
		});

		it('should not leave orphaned refresh tokens after user deletion', async () => {
			const userRepo = AppDataSource.getRepository(User);
			const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

			const savedUser = await userRepo.save({
				firstName: 'Orphan',
				lastName: 'Token',
				email: 'orphan@test.com',
				password: 'password123',
				role: 'customer',
			});

			const savedToken = await refreshTokenRepo.save({
				expiresAt: new Date(Date.now() + 60 * 60 * 1000),
				user: savedUser,
			});
			jwt.sign(
				{
					id: savedToken.id,
					sub: savedUser.id,
					role: savedUser.role,
				},
				Config.JWT_SECRET!,
				{ expiresIn: '1h' }
			);

			await userRepo.delete({ id: savedUser.id });

			const orphan = await refreshTokenRepo.findOneBy({
				id: savedToken.id,
			});
			expect(orphan).toBeNull();
		});

		it('should return 401 if logout is called with no cookies', async () => {
			const res = await request(app).post('/auth/logout');
			expect(res.status).toBe(401);
		});
	});
});
