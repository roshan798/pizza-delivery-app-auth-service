import request from 'supertest';
import app from '../../src/app';

describe('POST /tenants', () => {
	// happy path
	describe('Given all fields', () => {
		it('should create a tenant successfully', async () => {
			const response = await request(app)
				.post('/tenants')
				.send({
					name: 'New Tenant',
					address: 'A new tenant address for testing',
				})
				.expect(201);

			expect(response.body).toHaveProperty('id');
			// expect(response.body.name).toBe('New Tenant');
			// expect(response.body.description).toBe('A new tenant for testing');
		});
	});

	// sad path
	describe('Missing some or all fields', () => {
		it('should return 400 for missing name', async () => {
			const response = await request(app)
				.post('/tenants')
				.send({
					description: 'A tenant without a name',
				})
				.expect(400);

			expect(response.body.error).toBe('Name is required');
		});
		it('should return 400 for invalid data', async () => {
			const response = await request(app)
				.post('/tenants')
				.send({
					name: '', // Invalid name
					description: 'Invalid tenant data',
				})
				.expect(400);

			expect(response.body.error).toBe('Invalid tenant data');
		});
	});
});
