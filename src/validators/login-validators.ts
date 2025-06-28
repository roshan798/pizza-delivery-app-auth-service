import { checkSchema } from 'express-validator';

export default checkSchema({
	email: {
		notEmpty: {
			errorMessage: 'Email is Required!',
		},

		trim: true,
		isEmail: {
			errorMessage: 'Invalid email format!',
		},
	},
	password: {
		notEmpty: {
			errorMessage: 'Password is Required!',
		},
		trim: true,
	},
	// role validation will be added later
});
