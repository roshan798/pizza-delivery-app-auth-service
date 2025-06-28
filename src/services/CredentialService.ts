import bcrypt from 'bcrypt';
export class CredentialService {
	async comparePassword(password: string, hashedPassword: string) {
		return await bcrypt.compare(password, hashedPassword);
	}
}
