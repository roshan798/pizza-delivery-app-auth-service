import { checkSchema, Schema } from 'express-validator';

const notOnlyNumericRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9\s]+$/;

const baseTenantSchema: Schema = {
	name: {
		notEmpty: {
			errorMessage: 'Name is required!',
		},
		trim: true,
		matches: {
			options: [notOnlyNumericRegex],
			errorMessage:
				'Name must be alphanumeric and contain at least one letter.',
		},
		isLength: {
			options: { min: 3, max: 100 },
			errorMessage: 'Name must be between 3 and 100 characters long.',
		},
	},
	address: {
		notEmpty: {
			errorMessage: 'Address is required!',
		},
		trim: true,
		matches: {
			options: [notOnlyNumericRegex],
			errorMessage:
				'Address must be alphanumeric and contain at least one letter.',
		},
		isLength: {
			options: { min: 5, max: 255 },
			errorMessage: 'Address must be between 5 and 255 characters long.',
		},
	},
};

export const createTenantValidator = checkSchema(baseTenantSchema);

export const updateTenantValidator = checkSchema({
	...baseTenantSchema,
	name: { ...baseTenantSchema.name, optional: true },
	address: { ...baseTenantSchema.address, optional: true },
});

export const idParamValidator = checkSchema({
	id: {
		in: ['params'],
		notEmpty: {
			errorMessage: 'ID is required!',
		},
		trim: true,
		isInt: {
			options: { min: 1 },
			errorMessage: 'ID must be a positive integer!',
		},
	},
});
