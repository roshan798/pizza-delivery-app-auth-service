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
	JWT_SECRET,
	JWKS_URI,
	DOMAIN,
	SSL_REJECT_UNAUTHORIZED,
	RSA_PRIVATE_KEY,
	DB_URI,
} = process.env;

export const Config = {
	PORT,
	HOST,
	URL: `http://${HOST}:${PORT}`,
	NODE_ENV: process.env.NODE_ENV || 'dev',
	DB_HOST,
	DB_PORT,
	DB_USERNAME,
	DB_PASSWORD,
	DB_NAME,
	DB_LOGGING: DB_LOGGING === 'true' || DB_LOGGING === '1' ? true : false,
	JWT_SECRET,
	JWKS_URI,
	DOMAIN,
	SSL_REJECT_UNAUTHORIZED,
	RSA_PRIVATE_KEY,
	DB_URI,
};
