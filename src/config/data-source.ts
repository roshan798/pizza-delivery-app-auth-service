import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Config } from '.';

export const AppDataSource = new DataSource({
	type: 'postgres',
	host: Config.DB_HOST,
	port: Number(Config.DB_PORT),
	username: Config.DB_USERNAME,
	password: Config.DB_PASSWORD,
	database: Config.DB_NAME,
	synchronize: Config.NODE_ENV !== 'production',
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
