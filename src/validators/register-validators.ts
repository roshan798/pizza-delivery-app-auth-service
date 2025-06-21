import { body } from 'express-validator';
import { AppDataSource } from '../confiig/data-source';
import { User } from '../entity/User';
import logger from '../confiig/logger';

const registerValidator = [
	body('email')
		.notEmpty()
		.withMessage('Email is Required!')
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		.custom(async (value: string, { req }) => {
			const userRepository = AppDataSource.getRepository(User);
			const existingUser = await userRepository.findOne({
				where: { email: value },
			});
			if (existingUser) {
				logger.warn(`User with email ${value} already exists`);
				throw new Error('Email already exists');
			}
			logger.info(`No existing user found with email: ${value}`);
			return true;
		})
		.trim()
		.isEmail()
		.withMessage('Invalid email format!'),
];
export default registerValidator;
