import { checkSchema } from 'express-validator';
import { AppDataSource } from '../config/data-source';
import { User } from '../entity/User';
import logger from '../config/logger';

export default checkSchema({
	email: {
		notEmpty: {
			errorMessage: 'Email is Required!',
		},

		trim: true,
		isEmail: {
			errorMessage: 'Invalid email format!',
		},
		custom: {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			options: async (email: string, { req }) => {
				const userRepository = AppDataSource.getRepository(User);
				const existingUser = await userRepository.findOne({
					where: { email: email },
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
	firstName: {
		notEmpty: {
			errorMessage: 'First Name is Required!',
		},
		trim: true,
		isLength: {
			options: { min: 2 },
			errorMessage: 'First Name must be at least 2 characters long',
		},
	},
	lastName: {
		notEmpty: {
			errorMessage: 'Last Name is Required!',
		},
		trim: true,
		isLength: {
			options: { min: 2 },
			errorMessage: 'Last Name must be at least 2 characters long',
		},
	},
	password: {
		notEmpty: {
			errorMessage: 'Password is Required!',
		},
		trim: true,
		isLength: {
			options: { min: 6 },
			errorMessage: 'Password must be at least 6 characters long',
		},
		// isStrongPassword: {
		// 	errorMessage:
		// 		'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
		// },
	},
	// role validation will be added later
});
