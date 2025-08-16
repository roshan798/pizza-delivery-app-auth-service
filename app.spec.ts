import app from './src/app';
import request from 'supertest';

describe.skip('App', () => {
	it('should be defined', () => {
		expect(app).toBeDefined();
	});

	it('should respond with 200 on GET /', async () => {
		const response = await request(app).get('/');
		expect(response.statusCode).toBe(200);
	});
});
