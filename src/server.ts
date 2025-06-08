import { Config } from './confiig';

const sayHello = (name: string) => {
	const PORT = Config.PORT;
	const HOST = Config.HOST;
	console.log(`Server running at http://${HOST}:${PORT}/`);
	console.error(`Hello, ${name}!`);
	return `Hello, ${name}!`;
};
sayHello('World');
