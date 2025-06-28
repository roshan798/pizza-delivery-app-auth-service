import { DataSource } from 'typeorm';

export const truncateTables = async (connection: DataSource) => {
	const entities = connection.entityMetadatas;
	for (const entity of entities) {
		const repository = connection.getRepository(entity.name);
		await repository.clear();
	}
};

export function isValidCookieFormat(cookie: string | null): boolean {
	if (cookie === null) return false;

	const parts = cookie.split('.');
	if (parts.length !== 3) return false; // JWT should have 3 parts
	parts.forEach((part) => {
		try {
			Buffer.from(part, 'base64').toString(); // Validate base64 encoding
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (e) {
			return false; // If JSON parsing fails, it's not a valid JWT
		}
	});
	return true; // If all parts are valid, it's a valid JWT
}
