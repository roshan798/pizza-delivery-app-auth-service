import { config } from 'dotenv';
import path from 'node:path';
config({ path: path.join(__dirname, `../../.env.${process.env.NODE_ENV}`) });

const {
	PORT,
	HOST,
	DB_HOST,
	DB_PORT,
	DB_USERNAME,
	DB_PASSWORD,
	DB_NAME,
	DB_LOGGING,
} = process.env;

// eslint-disable-next-line no-console
console.log('Environment Variables:', {
	PORT,
	HOST,
	DB_HOST,
	DB_PORT,
	DB_USERNAME,
	DB_PASSWORD,
	DB_NAME,
	DB_LOGGING,
});

export const Config = {
	PORT,
	HOST,
	URL: `http://${HOST}:${PORT}`,
	NODE_ENV: process.env.NODE_ENV,
	DB_HOST,
	DB_PORT,
	DB_USERNAME,
	DB_PASSWORD,
	DB_NAME,
	DB_LOGGING: DB_LOGGING === 'true' || DB_LOGGING === '1' ? true : false,
};
