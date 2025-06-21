import { checkSchema } from 'express-validator';
import { AppDataSource } from '../confiig/data-source';
import { User } from '../entity/User';
import logger from '../confiig/logger';

export default checkSchema({
	email: {
		isEmail: {
			errorMessage: 'Invalid email format!',
		},
		notEmpty: {
			errorMessage: 'Email is Required!',
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
});
