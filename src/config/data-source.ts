import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Config } from '.';

export const AppDataSource = new DataSource({
	type: 'postgres',
	// url: Config.DB_URI,
	host: Config.DB_HOST,
	port: Number(Config.DB_PORT),
	username: Config.DB_USERNAME,
	password: Config.DB_PASSWORD,
	extra: {
		family: 4, // Force IPv4
	},
	database: Config.DB_NAME,
	synchronize: Config.NODE_ENV !== 'prod',
	logging: Config.DB_LOGGING,
	entities: [__dirname + '/../entity/**/*.{ts,js}'],
	migrations: [__dirname + '/../migrations/**/*.{ts,js}'],
	subscribers: [],
	ssl:
		Config.NODE_ENV === 'dev' || Config.DB_HOST === 'localhost'
			? false
			: {
					rejectUnauthorized: false,
				},
});
