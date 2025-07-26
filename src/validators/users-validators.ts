import { checkSchema, Schema } from 'express-validator';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import logger from '../config/logger';

const baseUserSchema: Schema = {
	firstName: {
		notEmpty: { errorMessage: 'First name is required!' },
		trim: true,
		isLength: {
			options: { min: 2, max: 50 },
			errorMessage: 'First name must be between 2 and 50 characters.',
		},
	},
	lastName: {
		notEmpty: { errorMessage: 'Last name is required!' },
		trim: true,
		isLength: {
			options: { min: 2, max: 50 },
			errorMessage: 'Last name must be between 2 and 50 characters.',
		},
	},
	email: {
		notEmpty: { errorMessage: 'Email is required!' },
		trim: true,
		isEmail: { errorMessage: 'Invalid email format!' },
		normalizeEmail: true,
	},
	tenantId: {
		notEmpty: { errorMessage: 'Tenant ID is required!' },
		isInt: {
			options: { min: 1 },
			errorMessage: 'Tenant ID must be a positive integer.',
		},
	},
};

// Validator for creating a new user (requires password + unique email check)
export const createUserValidator = checkSchema({
	...baseUserSchema,
	password: {
		notEmpty: { errorMessage: 'Password is required!' },
		isLength: {
			options: { min: 6, max: 100 },
			errorMessage: 'Password must be between 6 and 100 characters.',
		},
	},
	email: {
		...baseUserSchema.email,
		custom: {
			options: async (email: string) => {
				const userRepository = AppDataSource.getRepository(User);
				const existingUser = await userRepository.findOne({
					where: { email },
				});
				if (existingUser) {
					logger.warn(`User with email ${email} already exists`);
					throw new Error('Email already exists');
				}
				logger.info(`No existing user found with email: ${email}`);
				return true;
			},
		},
	},
});

// Validator for updating an existing user (all fields optional)
export const updateUserValidator = checkSchema({
	firstName: { ...baseUserSchema.firstName, optional: true },
	lastName: { ...baseUserSchema.lastName, optional: true },
	email: { ...baseUserSchema.email, optional: true },
	tenantId: { ...baseUserSchema.tenantId, optional: true },
	// Password excluded intentionally unless needed
});

// Validator for route parameter `id`
export const idParamValidator = checkSchema({
	id: {
		in: ['params'],
		notEmpty: { errorMessage: 'ID is required!' },
		trim: true,
		isInt: {
			options: { min: 1 },
			errorMessage: 'ID must be a positive integer!',
		},
	},
});
