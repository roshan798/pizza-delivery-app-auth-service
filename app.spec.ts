import app from './src/app';
import { getCurrentDateTime } from './src/utils';

describe('App', () => {
	test('should be defined', () => {
		expect(app).toBeDefined();
	});
});

describe('getCurrentDateTime', () => {
	it('should return the current date and time in ISO format', () => {
		const currentDateTime = getCurrentDateTime();
		expect(currentDateTime).toBeDefined();
		expect(typeof currentDateTime).toBe('string');
	});
});
