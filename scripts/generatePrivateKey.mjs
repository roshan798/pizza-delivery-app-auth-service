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
fs.mkdirSync('certs');
fs.writeFileSync('certs/publicKey.pem', publicKey);
fs.writeFileSync('certs/privateKey.pem', privateKey);
// put the generated keys in environment variables
