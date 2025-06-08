import { config } from 'dotenv';
config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

export const Config = {
	PORT,
	HOST,
	NODE_ENV: process.env.NODE_ENV,
};
