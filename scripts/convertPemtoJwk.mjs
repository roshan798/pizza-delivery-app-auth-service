/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import rsaPemToJwk from 'rsa-pem-to-jwk';

try {
	// ESM-compatible __dirname
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	// Use public key for JWK public conversion
	const pemPath = path.resolve(__dirname, '../certs/publicKey.pem');

	// Read the public key PEM
	const pem = fs.readFileSync(pemPath, 'utf8');

	// Convert to JWK
	const jwk = rsaPemToJwk(pem, { use: 'sig' }, 'public');

	// Print the result
	console.log(JSON.stringify(jwk, null, 2));
} catch (error) {
	if (error instanceof Error) {
		console.error('❌ Failed to convert PEM to JWK:', error.message);
	} else {
		console.error('❌ Unknown error occurred.');
	}
	process.exit(1);
}
