import request from 'supertest';
import app from '../../src/app';
describe('POST auth/register', () => {
	describe('Given all fields', () => {
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
	});

	describe('Missing some or all fields', () => {});
});
