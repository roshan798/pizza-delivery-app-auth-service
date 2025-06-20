import bcrypt from 'bcrypt';
export class HashService {
	private HASH_SALT_ROUNDS = 10;
	async hashPassword(password: string): Promise<string> {
		try {
			const isValidPassword =
				typeof password === 'string' && password.length > 0;
			if (!isValidPassword) {
				throw new Error('Invalid password provided for hashing');
			}
			const salt = await this.generateHashSalt();
			if (!salt) {
				throw new Error('Failed to generate salt for password hashing');
			}
			if (salt.length < 29) {
				throw new Error(
					'Generated salt is too short for bcrypt hashing'
				);
			}
			return await bcrypt.hash(password, salt);
		} catch (err) {
			if (err instanceof Error) {
				throw new Error(`Error hashing password: ${err.message}`);
			} else {
				throw new Error(
					`Error hashing password: ${JSON.stringify(err)}`
				);
			}
		}
	}
	async comparePassword(password: string, hash: string): Promise<boolean> {
		try {
			return await bcrypt.compare(password, hash);
		} catch (err) {
			if (err instanceof Error) {
				throw new Error(`Error comparing password: ${err.message}`);
			} else {
				throw new Error(
					`Error comparing password: ${JSON.stringify(err)}`
				);
			}
		}
	}
	async generateHashSalt(): Promise<string> {
		try {
			return await bcrypt.genSalt(this.HASH_SALT_ROUNDS);
		} catch (err) {
			if (err instanceof Error) {
				throw new Error(`Error generating hash salt: ${err.message}`);
			} else {
				throw new Error(
					`Error generating hash salt: ${JSON.stringify(err)}`
				);
			}
		}
	}
}
