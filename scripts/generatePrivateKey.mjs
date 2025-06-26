import crypto from 'node:crypto';
import fs from 'node:fs';

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
	modulusLength: 2048,
	publicKeyEncoding: {
		type: 'pkcs1',
		format: 'pem',
	},
	privateKeyEncoding: {
		type: 'pkcs1',
		format: 'pem',
	},
});
try {
	fs.mkdirSync('certs');
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (e) {
	// console.error('Cannot create folder ', e);
}
fs.writeFileSync('certs/publicKey.pem', publicKey);
fs.writeFileSync('certs/privateKey.pem', privateKey);
