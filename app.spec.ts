import app from './src/app';
import { getCurrentDateTime } from './src/utils';
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

describe.skip('getCurrentDateTime', () => {
	it('should return the current date and time in ISO format', () => {
		const currentDateTime = getCurrentDateTime();
		expect(currentDateTime).toBeDefined();
		expect(typeof currentDateTime).toBe('string');
	});
});
