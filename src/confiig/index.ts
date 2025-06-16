import { config } from 'dotenv';
config();

const PORT = process.env.PORT || 8080; // Default to 8080 if PORT is not set
const HOST = process.env.HOST || 'localhost';

export const Config = {
	PORT,
	HOST,
	URL: `http://${HOST}:${PORT}`,
	NODE_ENV: process.env.NODE_ENV,
};
