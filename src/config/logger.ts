import winston from 'winston';

const logger = winston.createLogger({
	level: 'info',
	defaultMeta: {
		service: 'auth-service',
	},
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json(),
		winston.format.prettyPrint()
	),
	transports: [
		new winston.transports.Console({
			level: 'info',
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple()
			),
			silent:
				process.env.NODE_ENV === 'test' &&
				process.env.LOGGING === 'false',
		}),
		new winston.transports.File({
			filename: 'logs/error.log',
			level: 'error',
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.json()
			),
			silent:
				process.env.NODE_ENV === 'test' &&
				process.env.LOGGING === 'false',
		}),
		new winston.transports.File({
			level: 'debug',
			filename: 'logs/combined.log',
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.json()
			),
			silent:
				process.env.NODE_ENV === 'test' &&
				process.env.LOGGING === 'false',
		}),
	],
});

export default logger;
